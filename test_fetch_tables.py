#!/usr/bin/env python3
"""
Script di test per diagnosticare problemi con il fetch delle tabelle
"""

import requests
import json
import os
import subprocess
from dotenv import load_dotenv

# Carica variabili d'ambiente
load_dotenv()

def test_webhook_server():
    """Test se il webhook server è attivo"""
    print("🔍 Testing webhook server...")
    
    try:
        response = requests.get("http://localhost:5000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Webhook server is running")
            data = response.json()
            print(f"   Running syncs: {data.get('running_syncs', [])}")
            return True
        else:
            print(f"❌ Webhook server returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to webhook server: {e}")
        return False

def test_ngrok():
    """Test se ngrok è configurato e attivo"""
    print("\n🔍 Testing ngrok...")
    
    ngrok_url = os.getenv('NEXT_PUBLIC_WEBHOOK_URL')
    if not ngrok_url:
        print("❌ NEXT_PUBLIC_WEBHOOK_URL not configured in .env")
        return False
    
    if 'localhost' in ngrok_url:
        print("⚠️  WEBHOOK_URL points to localhost, not ngrok")
        return False
    
    try:
        response = requests.get(f"{ngrok_url}/health", timeout=10)
        if response.status_code == 200:
            print(f"✅ ngrok is working: {ngrok_url}")
            return True
        else:
            print(f"❌ ngrok returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to ngrok: {e}")
        return False

def test_convex_cli():
    """Test se Convex CLI è installato"""
    print("\n🔍 Testing Convex CLI...")
    
    try:
        # Test npx convex --version
        result = subprocess.run(
            ['npx', 'convex', '--version'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"✅ Convex CLI is installed: {version}")
            return True
        else:
            print(f"❌ Convex CLI error: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print("❌ Convex CLI timeout")
        return False
    except FileNotFoundError:
        print("❌ npx not found - Node.js not installed?")
        return False
    except Exception as e:
        print(f"❌ Convex CLI test failed: {e}")
        return False

def test_fetch_tables(deploy_key):
    """Test fetch tables con un deploy key specifico"""
    print(f"\n🔍 Testing fetch tables with deploy key: {deploy_key[:20]}...")
    
    webhook_url = os.getenv('NEXT_PUBLIC_WEBHOOK_URL', 'http://localhost:5000')
    webhook_token = os.getenv('NEXT_PUBLIC_WEBHOOK_TOKEN', 'test-token-12345')
    
    try:
        response = requests.post(
            f"{webhook_url}/api/fetch-tables",
            json={"deploy_key": deploy_key},
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {webhook_token}"
            },
            timeout=60
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                tables = data.get('tables', [])
                print(f"✅ Fetch successful! Found {len(tables)} tables:")
                for table in tables[:10]:  # Show first 10 tables
                    print(f"   - {table}")
                if len(tables) > 10:
                    print(f"   ... and {len(tables) - 10} more")
                return True
            else:
                print(f"❌ Fetch failed: {data}")
                return False
        else:
            print(f"❌ HTTP Error {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False

def main():
    print("=" * 60)
    print("DIAGNOSI FETCH TABLES - CONVEX TO SQL SERVER")
    print("=" * 60)
    
    # Test 1: Webhook Server
    webhook_ok = test_webhook_server()
    
    # Test 2: ngrok
    ngrok_ok = test_ngrok()
    
    # Test 3: Convex CLI
    cli_ok = test_convex_cli()
    
    # Test 4: Fetch Tables (se abbiamo un deploy key)
    deploy_key = input("\n📝 Inserisci il tuo Convex deploy key per testare (opzionale): ").strip()
    
    fetch_ok = True
    if deploy_key:
        fetch_ok = test_fetch_tables(deploy_key)
    else:
        print("⏭️  Skipping fetch tables test (no deploy key provided)")
    
    # Riepilogo
    print("\n" + "=" * 60)
    print("RIEPILOGO DIAGNOSI")
    print("=" * 60)
    print(f"Webhook Server: {'✅ OK' if webhook_ok else '❌ FAIL'}")
    print(f"ngrok:          {'✅ OK' if ngrok_ok else '❌ FAIL'}")
    print(f"Convex CLI:     {'✅ OK' if cli_ok else '❌ FAIL'}")
    if deploy_key:
        print(f"Fetch Tables:   {'✅ OK' if fetch_ok else '❌ FAIL'}")
    
    if all([webhook_ok, ngrok_ok, cli_ok, fetch_ok]):
        print("\n🎉 Tutto funziona correttamente!")
    else:
        print("\n⚠️  Ci sono problemi da risolvere. Consulta TROUBLESHOOT_FETCH_TABLES_IT.md")
    
    print("\n📚 Per maggiori dettagli, leggi: dashboard/TROUBLESHOOT_FETCH_TABLES_IT.md")

if __name__ == "__main__":
    main()