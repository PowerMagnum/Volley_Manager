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

if(os.path.exists("PASSWORD.txt")):
    with open("PASSWORD.txt", "r") as f:
        psw = f.read()
else:
    psw = input("file password assente -> inserire password: ")
    with open("PASSWORD.txt", "w") as f:
        f.write(psw)

salt = bcrypt.gensalt().decode("utf-8")
hashed = sha256((psw + salt).encode('utf-8')).hexdigest().encode("utf-8")
auth = codecs.encode(codecs.decode(hashed, 'hex'), 'base64').decode("utf-8").strip()

#print("Salt:",salt)
#print("Hash:",hashed)
#print("Auth:",auth)

def get_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0)
        # doesn't even have to be reachable
        s.connect(('10.254.254.254', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

def initialize_file():
    if(not os.path.exists("punti1.txt")):
        with open("punti1.txt", "w") as f:
            f.write("0")
            print("Generato p1")
    if(not os.path.exists("punti2.txt")):
        with open("punti2.txt", "w") as f:
            f.write("0")
            print("Generato p2")
    if(not os.path.exists("set1.txt")):
        with open("set1.txt", "w") as f:
            f.write("0")
            print("Generato s1")
    if(not os.path.exists("set2.txt")):
        with open("set2.txt", "w") as f:
            f.write("0")
            print("Generato s2")

def read():
    res = []
    with open("punti1.txt", "r") as f:
        data = f.read()
        res.append(int(data) if data else 0)
    with open("punti2.txt", "r") as f:
        data = f.read()
        res.append(int(data) if data else 0)
    with open("set1.txt", "r") as f:
        data = f.read()
        res.append(int(data) if data else 0)
    with open("set2.txt", "r") as f:
        data = f.read()
        res.append(int(data) if data else 0)
    return res

def update(campo, progressivo):
    file = {"Punti1":"punti1.txt", "Punti2":"punti2.txt", "Set1":"set1.txt", "Set2":"set2.txt"}
    with open(file[campo],"r") as f:
        data = f.read()
        val = int(data if data else 0)
        if(val + progressivo < 0):
            return
    with open(file[campo],"w") as f:
        f.write(str(val + progressivo))

def reset():
    file = {"Punti1":"punti1.txt", "Punti2":"punti2.txt", "Set1":"set1.txt", "Set2":"set2.txt"}
    with open(file["Punti1"],"w") as f:
        f.write("0")
    with open(file["Punti2"],"w") as f:
        f.write("0")    

async def handler(websocket):
    try:
        await websocket.send(f'{{"code":"[C]","val":"{salt}"}}')
        print("[SEND]:",f'{{"code":"[C]","val":"{salt}"}}')
        while True:
            message = await websocket.recv()
            print("[RECV]:",message)
            data = json.loads(message)
            if(data["code"] == "[C]"):
                if(data["val"] == str(auth)):
                    await websocket.send('{"code":"[A]","val":"OK"}')
                else:
                    await websocket.send('{"code":"[A]","val":"ERROR"}')
            elif(data["code"] == "[Read]"):
                punti = read()
                await websocket.send(f'{{"code":"[Read]","val":{punti}}}')
                print("[SEND]:",f'{{"code":"[Read]","val":{punti}}}')
            elif(data["code"] == "[Write]"):
                update(data["val"]["campo"], data["val"]["progressivo"])
                punti = read()
                await websocket.send(f'{{"code":"[Read]","val":{punti}}}')
                print("[SEND]:",f'{{"code":"[Read]","val":{punti}}}')
            elif(data["code"] == "[Reset]"):
                reset()
                punti = read()
                await websocket.send(f'{{"code":"[Read]","val":{punti}}}')
                print("[SEND]:",f'{{"code":"[Read]","val":{punti}}}')

            message = ""
            data = ""
    except:
        print("[CONN_STATE]: Il client ha terminato la connessione\n\n")
        
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
        async def cancel_handler():
            while True:
                await asyncio.sleep(1)
                try:
                    await asyncio.sleep(0)
                except asyncio.CancelledError:
                    raise

        cancel_task = asyncio.create_task(cancel_handler())
        
        async with websockets.serve(handler, DestIP, 8765):
            await asyncio.Future()  # run forever
    except:
        print("[CONN_STATE]: Chiusura del server")

if __name__ == "__main__":
    print("Loading...")
    try:
        asyncio.run(main())
    except:
        print("[--- Server Offline ---]")
        exit()