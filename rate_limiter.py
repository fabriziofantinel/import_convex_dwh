"""
Rate Limiting Module for Webhook Server
Requirements: 10.6 - Limit requests per IP
"""

import time
import threading
from collections import defaultdict, deque
from typing import Dict, Tuple
from flask import request, jsonify


class RateLimiter:
    """
    Token bucket rate limiter with per-IP tracking
    """
    
    def __init__(self, requests_per_minute: int = 60, burst_size: int = 10):
        """
        Initialize rate limiter
        
        Args:
            requests_per_minute: Maximum requests per minute per IP
            burst_size: Maximum burst requests allowed
        """
        self.requests_per_minute = requests_per_minute
        self.burst_size = burst_size
        self.refill_rate = requests_per_minute / 60.0  # tokens per second
        
        # Per-IP token buckets: {ip: (tokens, last_refill_time)}
        self.buckets: Dict[str, Tuple[float, float]] = {}
        self.lock = threading.Lock()
        
        # Track request history for monitoring
        self.request_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=100))
        
        # Blocked IPs (temporary blocks)
        self.blocked_ips: Dict[str, float] = {}  # {ip: unblock_time}
        
        # Cleanup thread
        self.cleanup_thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        self.cleanup_thread.start()
    
    def _get_client_ip(self) -> str:
        """Get client IP address from request"""
        # Check for forwarded headers (when behind proxy/load balancer)
        forwarded_for = request.headers.get('X-Forwarded-For')
        if forwarded_for:
            # Take the first IP in the chain
            return forwarded_for.split(',')[0].strip()
        
        real_ip = request.headers.get('X-Real-IP')
        if real_ip:
            return real_ip.strip()
        
        # Fallback to direct connection IP
        return request.remote_addr or 'unknown'
    
    def _refill_bucket(self, ip: str, current_time: float) -> float:
        """Refill token bucket for IP"""
        if ip not in self.buckets:
            # New IP, start with full burst capacity
            self.buckets[ip] = (self.burst_size, current_time)
            return self.burst_size
        
        tokens, last_refill = self.buckets[ip]
        
        # Calculate tokens to add based on time elapsed
        time_elapsed = current_time - last_refill
        tokens_to_add = time_elapsed * self.refill_rate
        
        # Cap at burst size
        new_tokens = min(self.burst_size, tokens + tokens_to_add)
        
        # Update bucket
        self.buckets[ip] = (new_tokens, current_time)
        
        return new_tokens
    
    def is_allowed(self) -> Tuple[bool, Dict]:
        """
        Check if request is allowed for current IP
        
        Returns:
            (allowed, info_dict)
        """
        current_time = time.time()
        ip = self._get_client_ip()
        
        with self.lock:
            # Check if IP is temporarily blocked
            if ip in self.blocked_ips:
                if current_time < self.blocked_ips[ip]:
                    return False, {
                        'error': 'IP temporarily blocked',
                        'ip': ip,
                        'unblock_time': self.blocked_ips[ip],
                        'retry_after': int(self.blocked_ips[ip] - current_time)
                    }
                else:
                    # Block expired, remove it
                    del self.blocked_ips[ip]
            
            # Refill bucket
            tokens = self._refill_bucket(ip, current_time)
            
            # Check if request can be allowed
            if tokens >= 1.0:
                # Allow request, consume token
                self.buckets[ip] = (tokens - 1.0, current_time)
                
                # Record request
                self.request_history[ip].append(current_time)
                
                return True, {
                    'allowed': True,
                    'ip': ip,
                    'tokens_remaining': tokens - 1.0,
                    'requests_per_minute': self.requests_per_minute
                }
            else:
                # Rate limit exceeded
                # Check if this IP should be temporarily blocked
                recent_requests = self._count_recent_requests(ip, current_time, window=60)
                
                if recent_requests > self.requests_per_minute * 2:  # 2x the limit
                    # Temporarily block IP for 5 minutes
                    self.blocked_ips[ip] = current_time + 300
                    
                    return False, {
                        'error': 'Rate limit exceeded - IP temporarily blocked',
                        'ip': ip,
                        'retry_after': 300,
                        'requests_per_minute': self.requests_per_minute
                    }
                
                return False, {
                    'error': 'Rate limit exceeded',
                    'ip': ip,
                    'retry_after': int(60 / self.refill_rate),  # Time to get next token
                    'requests_per_minute': self.requests_per_minute
                }
    
    def _count_recent_requests(self, ip: str, current_time: float, window: int = 60) -> int:
        """Count requests from IP in the last window seconds"""
        if ip not in self.request_history:
            return 0
        
        cutoff_time = current_time - window
        history = self.request_history[ip]
        
        # Count requests after cutoff time
        count = 0
        for req_time in reversed(history):  # Most recent first
            if req_time >= cutoff_time:
                count += 1
            else:
                break  # Older requests, stop counting
        
        return count
    
    def _cleanup_loop(self):
        """Background cleanup of old data"""
        while True:
            try:
                time.sleep(300)  # Run every 5 minutes
                current_time = time.time()
                
                with self.lock:
                    # Clean up old buckets (inactive for 1 hour)
                    inactive_cutoff = current_time - 3600
                    inactive_ips = [
                        ip for ip, (_, last_refill) in self.buckets.items()
                        if last_refill < inactive_cutoff
                    ]
                    
                    for ip in inactive_ips:
                        del self.buckets[ip]
                        if ip in self.request_history:
                            del self.request_history[ip]
                    
                    # Clean up expired blocks
                    expired_blocks = [
                        ip for ip, unblock_time in self.blocked_ips.items()
                        if current_time >= unblock_time
                    ]
                    
                    for ip in expired_blocks:
                        del self.blocked_ips[ip]
                    
                    if inactive_ips or expired_blocks:
                        print(f"[RateLimiter] Cleaned up {len(inactive_ips)} inactive IPs, "
                              f"{len(expired_blocks)} expired blocks")
            
            except Exception as e:
                print(f"[RateLimiter] Cleanup error: {e}")
    
    def get_stats(self) -> Dict:
        """Get rate limiter statistics"""
        current_time = time.time()
        
        with self.lock:
            active_ips = len(self.buckets)
            blocked_ips = len(self.blocked_ips)
            
            # Count recent requests across all IPs
            total_recent_requests = 0
            for ip in self.request_history:
                total_recent_requests += self._count_recent_requests(ip, current_time, 60)
            
            return {
                'active_ips': active_ips,
                'blocked_ips': blocked_ips,
                'total_recent_requests': total_recent_requests,
                'requests_per_minute_limit': self.requests_per_minute,
                'burst_size': self.burst_size
            }


# Global rate limiter instance
rate_limiter = None


def init_rate_limiter(requests_per_minute: int = 60, burst_size: int = 10):
    """Initialize global rate limiter"""
    global rate_limiter
    rate_limiter = RateLimiter(requests_per_minute, burst_size)
    return rate_limiter


def rate_limit_decorator(f):
    """Decorator to apply rate limiting to Flask routes"""
    def decorated_function(*args, **kwargs):
        if rate_limiter is None:
            # Rate limiting not initialized, allow request
            return f(*args, **kwargs)
        
        allowed, info = rate_limiter.is_allowed()
        
        if not allowed:
            response = jsonify({
                'error': info.get('error', 'Rate limit exceeded'),
                'retry_after': info.get('retry_after', 60)
            })
            response.status_code = 429  # Too Many Requests
            
            # Add rate limit headers
            response.headers['X-RateLimit-Limit'] = str(rate_limiter.requests_per_minute)
            response.headers['X-RateLimit-Remaining'] = '0'
            response.headers['X-RateLimit-Reset'] = str(int(time.time() + info.get('retry_after', 60)))
            response.headers['Retry-After'] = str(info.get('retry_after', 60))
            
            return response
        
        # Add rate limit headers to successful responses
        response = f(*args, **kwargs)
        if hasattr(response, 'headers'):
            response.headers['X-RateLimit-Limit'] = str(rate_limiter.requests_per_minute)
            response.headers['X-RateLimit-Remaining'] = str(int(info.get('tokens_remaining', 0)))
        
        return response
    
    decorated_function.__name__ = f.__name__
    return decorated_function


def get_rate_limit_stats():
    """Get rate limiting statistics"""
    if rate_limiter is None:
        return {'error': 'Rate limiter not initialized'}
    
    return rate_limiter.get_stats()