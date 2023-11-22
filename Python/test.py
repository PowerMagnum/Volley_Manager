#!.\venv\Scripts\python.exe

import asyncio
from hashlib import sha256
import json
import codecs
import os
import bcrypt
import websockets
import socket
from sys import argv


def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.settimeout(0)
    try:
        # doesn't even have to be reachable
        s.connect(('10.254.254.254', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

async def handler(websocket):
    try:
        #await websocket.send(f'{{"code":"[C]","val":"{salt}"}}')
        #print("[SEND]:",f'{{"code":"[C]","val":"{salt}"}}')
        while True:
            message = await websocket.recv()
            print("[RECV]:",message)
            message = ""
    except Exception as e:
        print(e)
        print("\n@")
        
        
async def main():
    IP_force = argv[1].lower() if (len(argv) > 1) else 'free'
    IP = argv[2] if (len(argv) > 2) else 'localhost'
    print("IP_force state: " + IP_force)
    if IP_force == "localhost":
        DestIP = 'localhost'
    elif IP_force == "force":
        DestIP = IP
    elif IP_force == "free":
        DestIP = str(get_ip())
    else:
        print("Error IP_force: admitted 'force' ['free'] 'localhost'")
    
    #indirizzo = "192.168.0.101"
    print("[--- Server Online ---]")
    print("Avvio server con ip: ", DestIP)
    try:
        async with websockets.serve(handler, DestIP, 4455):
            await asyncio.Future()  # run forever
    except Exception as e:
        print(e)
        print("\n@")
        print("[CONN_STATE]: Errore link IP")

if __name__ == "__main__":
    print("Loading...")
    asyncio.run(main())
