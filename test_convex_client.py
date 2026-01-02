"""
Test del Convex Client.
"""

from src.convex import ConvexClient, ConvexError

# Configurazione
DEPLOY_KEY = "preview:fabrizio-fantinel:appclinics|eyJ2MiI6ImRkNTZjNWVkM2NjYTQ2NzBhZGRjNDAzYjdjOTA4ZTk3In0="

print("\n" + "="*70)
print("TEST CONVEX CLIENT")
print("="*70 + "\n")

# Crea il client
print("1. Creazione client...")
client = ConvexClient(DEPLOY_KEY)
print("   ✓ Client creato\n")

# Scarica e leggi i dati
print("2. Download e lettura dati...")
try:
    data = client.get_backup_data()
    print(f"   ✓ Dati scaricati!\n")
    
    # Mostra statistiche
    print("="*70)
    print("DATI SCARICATI")
    print("="*70 + "\n")
    
    for table_name, records in data.items():
        print(f"📊 Tabella: {table_name}")
        print(f"   Record: {len(records)}")
        
        if len(records) > 0:
            # Mostra i campi
            fields = list(records[0].keys())
            print(f"   Campi: {', '.join(fields[:5])}")
            if len(fields) > 5:
                print(f"          ... e altri {len(fields) - 5} campi")
            
            # Mostra un esempio
            print(f"   Esempio: {records[0]}")
        
        print()
    
    print("="*70)
    print("✓ TEST COMPLETATO CON SUCCESSO!")
    print("="*70 + "\n")
    
except ConvexError as e:
    print(f"   ✗ Errore: {e}\n")
    exit(1)
