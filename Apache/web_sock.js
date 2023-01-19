//let socket = new WebSocket("wss://192.168.1.91:4455");
//let socket = new WebSocket("wss://javascript.info/article/websocket/demo/hello");
//let socket = new WebSocket("ws://192.168.1.91:4455");

//function connect(psw, ip){
    console.log("logging");
    //console.log(psw,ip);
    setCookie("IP",ip,1);
    setCookie("CODE",psw,1);
    var id_item = {};
    var item_id = {};

    try{
        let socket = new WebSocket("ws://" + ip + ":4455");
        let py_sock = new WebSocket("ws://" + ip + ":8765"); 

        socket.onopen = function(e) {
            console.log("[OBS] Connection established");
        };

        socket.onmessage = function(event) {
            console.log(`[OBS] Data received from server:`);
            console.log(JSON.parse(event.data));
            if (JSON.parse(event.data)['op'] == 0 ){
                var autentica = "";

                if(JSON.parse(event.data)['d'].hasOwnProperty('authentication')){
                    var challenge = JSON.parse(event.data)['d']['authentication']['challenge'];
                    var salt = JSON.parse(event.data)['d']['authentication']['salt'];

                    hash(psw + salt).then(function(value){
                        autentica = hexToBase64(value);
                        hash(autentica + challenge).then(function(value){
                            autentica = hexToBase64(value);                   
                            let auth = {"op": 1, "d": { "rpcVersion": 1, "authentication": autentica,  "eventSubscriptions": 33}};
                            socket.send(JSON.stringify(auth));
                        });
                    });
                }else{
                    let auth = {"op": 1, "d": { "rpcVersion": 1, "authentication": autentica, "eventSubscriptions": 33 }};
                    socket.send(JSON.stringify(auth));
                }
            }else if(JSON.parse(event.data)['op'] == 2 ){
                console.log("-#-#-[ SERVER OBS PRONTO AL FUNZIONAMENTO ]-#-#-");
                getItem();
            }else if(JSON.parse(event.data)['op'] == 7 ){
                //console.log(JSON.parse(event.data)['d']['responseData']);
                if(JSON.parse(event.data)['d']['requestType'] == "GetSceneItemList"){
                    items = JSON.parse(event.data)['d']['responseData']['sceneItems'];
                    //console.log("Gransuca",items);
                    for(i in items){
                        if(items[i]['sourceName'] == 'AvvisoMatchPoint'){
                            console.log("Matchpoint:",items[i]['sceneItemId']);
                            item_id[items[i]['sceneItemId']] = "Matchpoint";
                            id_item['Matchpoint'] = items[i]['sceneItemId'];
                        }
                        if(items[i]['sourceName'] == 'AvvisoFineSet'){
                            console.log("FineSet:",items[i]['sceneItemId']);
                            item_id[items[i]['sceneItemId']] = "FineSet";                            
                            id_item['FineSet'] = items[i]['sceneItemId'];
                        }
                        if(items[i]['sourceName'] == 'AvvisoTimeOut'){
                            console.log("Timeout:",items[i]['sceneItemId']);
                            item_id[items[i]['sceneItemId']] = "Timeout";
                            id_item['Timeout'] = items[i]['sceneItemId'];
                        }
                    }
                    getVisibility();
                    //setInterval(getVisibility(),7);
                }else if(JSON.parse(event.data)['d']['requestType'] == "GetSceneItemEnabled"){
                    data = JSON.parse(event.data)['d'];
                    if((data['responseData']['sceneItemEnabled'])){
                        $("#M"+item_id[data['requestId']]).hide();
                        $("#N"+item_id[data['requestId']]).show();
                    }else{
                        $("#N"+item_id[data['requestId']]).hide();
                        $("#M"+item_id[data['requestId']]).show();
                    }
                }
            }
        };

        socket.onclose = function(event) {
            if (event.wasClean) {
                console.log(`[OBS] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
            } else {
                // e.g. server process killed or network down
                // event.code is usually 1006 in this case
                console.log('[OBS] Connection died');
                alert("La connessione a OBS è terminata");
            }
        };

        socket.onerror = function(error) {
            console.log(`[OBS error]`);
            alert("Errore server OBS... ");
        }; 

        py_sock.onopen = function(e) {
            console.log("[Python] Py Connection established"); 
        };

        py_sock.onmessage = function(event) {
            console.log(`[Python] Data received from  Py server:`);
            console.log(JSON.parse(event.data));
            if(JSON.parse(event.data)["code"] == "[C]"){
                var py_salt = JSON.parse(event.data)["val"];
                hash(psw + py_salt).then(function(value){
                    let py_auth = hexToBase64(value);                 
                    let auth = {"code":"[C]","val":py_auth};
                    py_sock.send(JSON.stringify(auth));
                    //console.log(py_auth);
                });
            }else if(JSON.parse(event.data)["code"] == "[A]"){
                if(JSON.parse(event.data)["val"] == "OK"){
                    console.log("-#-#-[ SERVER PYTHON PRONTO AL FUNZIONAMENTO ]-#-#-");
                    setInterval(file_read(),5);
                }else{
                    console.log("-!-!-[ IL SERVER PYTHON HA RIFIUTATO LA CONNESSIONE]-!-!-");
                }
            }else if(JSON.parse(event.data)["code"] == "[Read]"){
                $("#Punti1").html(JSON.parse(event.data)["val"][0]);
                $("#Punti2").html(JSON.parse(event.data)["val"][1]);
                $("#Set1").html(JSON.parse(event.data)["val"][2]);
                $("#Set2").html(JSON.parse(event.data)["val"][3]);
            }
        };

        py_sock.onclose = function(event) {
            if (event.wasClean) {
                console.log(`[Python] Py Connection closed cleanly, code=${event.code} reason=${event.reason}`);
            } else {
                // e.g. server process killed or network down
                // event.code is usually 1006 in this case
                console.log('[Python] Py Connection died');
                alert("La connessione a Python è terminata");
            }
        };

        py_sock.onerror = function(error) {
            console.log(`[Python error]`);
            alert("Errore server Python... ");
        }; 

        function file_read(){
            let command = {"code":"[Read]"};
            py_sock.send(JSON.stringify(command));
        }

        function update(campo, progressivo){
            let command = {"code":"[Write]", "val":{"campo":campo,"progressivo":progressivo}};
            py_sock.send(JSON.stringify(command));
        }

        function reset(){
            if(confirm("Sei sicuro di voler resettare i punti?")){
                let command = {"code":"[Reset]"};
                py_sock.send(JSON.stringify(command));
            }
        }
        
        function toggle(name, value, scena = "Punteggio"){
            let command = {
                "op": 6,
                "d": {
                    "requestType": "SetSceneItemEnabled",
                    "requestId": "",
                    "requestData": {
                        "sceneName": scena,
                        "sceneItemId": id_item[name],
                        "sceneItemEnabled": value,
                    }
                }
            }
            socket.send(JSON.stringify(command));
            getVisibility();
        }

        function getVisibility(scena = "Punteggio"){
            for(item in item_id){
                let command = {
                    "op": 6,
                    "d": {
                        "requestType": "GetSceneItemEnabled",
                        "requestId": item,
                        "requestData": {
                            "sceneName": scena,
                            "sceneItemId": parseInt(item)
                        }
                    }
                }
                socket.send(JSON.stringify(command));
            }
        }

        function getItem(){
            let command = {
                "op": 6,
                "d": {
                    "requestType": "GetSceneItemList",
                    "requestId": "",
                    "requestData": {
                        "sceneName": "Punteggio"
                    }
                }
            }
            socket.send(JSON.stringify(command));
        }

        async function hash(string) {
            const utf8 = new TextEncoder().encode(string);
            const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray
            .map((bytes) => bytes.toString(16).padStart(2, '0'))
            .join('');
            return hashHex;
        }

        function hexToBase64(hexstring) {
            return btoa(hexstring.match(/\w{2}/g).map(function(a) {
                return String.fromCharCode(parseInt(a, 16));
            }).join(""));
        }


    }catch(e){
        alert("Qualcosa è andato storto... " + e);
    }
//}

$("p").addClass("user-select-none"); //Cursore

