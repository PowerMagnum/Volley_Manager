'''
import asyncio
import websockets

psw = input("Inserisci Password: ")

async def echo(websocket, path):
    await websocket.send("[C]")
    async for message in websocket:
        await websocket.send(message)

asyncio.get_event_loop().run_until_complete(
    websockets.serve(echo, 'localhost', 8765))
asyncio.get_event_loop().run_forever()
'''
'''
import asyncio
from websockets import connect

psw = input("Inserisci Password: ")

async def hello(uri):
    async with connect(uri) as websocket:
        await websocket.send("[C]")
        await websocket.recv()

asyncio.run(hello("ws://localhost:8765"))
'''


import asyncio
from hashlib import sha256
import base64
import json
import codecs
import os
import bcrypt
import websockets

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
print("[--- Server Online ---]")
#print("Salt:",salt)
#print("Hash:",hashed)
#print("Auth:",auth)

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

async def main():
    async with websockets.serve(handler, "localhost", 8765):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())