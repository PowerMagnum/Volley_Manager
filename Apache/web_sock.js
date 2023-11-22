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
    var now_showed = 0;
    var OBS_message;
    
    const FullGoal = 25;
    const HalfGoal = 15;
    var Goal = FullGoal;
    var tb_check = null;
    
    var AP_LogStyle = "color:#00FF00;";
    var OBS_LogStyle = "color:#00FFFF;";
    var PY_LogStyle = "color:#FFFF00";
    var Show_STATE = "";

    var AP_Enable = true;
    var lastWinner = 0;

    try{
        let socket = new WebSocket("ws://" + ip + ":4455");
        let py_sock = new WebSocket("ws://" + ip + ":8765"); 

        socket.onopen = function(e) {
            console.log("%c[OBS] Connection established",OBS_LogStyle);
        };

        socket.onmessage = function(event) {
            //var test = "{`[OBS] Data received from server:`: 0}";
            //console.log(JSON.parse(event.data));
            if (JSON.parse(event.data)['op'] == 0 ){
                console.log({"[OBS] Connection Data:": JSON.parse(event.data)});
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
                console.log({"[OBS] Authenting Data:": JSON.parse(event.data)});
                console.log("%c-#-#-[ SERVER OBS PRONTO AL FUNZIONAMENTO ]-#-#-",OBS_LogStyle);
                getItem();
            }else if(JSON.parse(event.data)['op'] == 7 ){
                if(JSON.parse(event.data)['d']['requestType'] == "GetSceneItemList"){
                    console.log({"[OBS] Get Items List:": JSON.parse(event.data)});
                    items = JSON.parse(event.data)['d']['responseData']['sceneItems'];
                    //console.log("Gransuca",items);
                    for(i in items){
                        if(items[i]['sourceName'] == 'AvvisoMatchPoint'){
                            console.log("Matchpoint OBS ID:",items[i]['sceneItemId']);
                            item_id[items[i]['sceneItemId']] = "Matchpoint";
                            id_item['Matchpoint'] = items[i]['sceneItemId'];
                        }
                        if(items[i]['sourceName'] == 'AvvisoFineSet'){
                            console.log("FineSet OBS ID:",items[i]['sceneItemId']);
                            item_id[items[i]['sceneItemId']] = "FineSet";                            
                            id_item['FineSet'] = items[i]['sceneItemId'];
                        }
                        if(items[i]['sourceName'] == 'AvvisoTimeOut'){
                            console.log("Timeout OBS ID:",items[i]['sceneItemId']);
                            item_id[items[i]['sceneItemId']] = "Timeout";
                            id_item['Timeout'] = items[i]['sceneItemId'];
                        }
                    }
                    getVisibility();
                    //setInterval(getVisibility(),7);
                }else if(JSON.parse(event.data)['d']['requestType'] == "GetSceneItemEnabled"){
                    console.log({"[OBS] Get Item Visibility:": JSON.parse(event.data)});
                    data = JSON.parse(event.data)['d'];
                    if((data['responseData']['sceneItemEnabled'])){
                        $("#M"+item_id[data['requestId']]).hide();
                        $("#N"+item_id[data['requestId']]).show();
                    }else{
                        $("#N"+item_id[data['requestId']]).hide();
                        $("#M"+item_id[data['requestId']]).show();
                    }
                }else if(JSON.parse(event.data)['d']['requestType'] == "SetSceneItemEnabled"){
                    console.log({"[OBS] Set Item Visibility ACK:": JSON.parse(event.data)});
                }
            }
        };

        socket.onclose = function(event) {
            if (event.wasClean) {
                console.log(`%c[OBS] Connection closed cleanly, code=${event.code} reason=${event.reason}`,OBS_LogStyle);
            } else {
                // e.g. server process killed or network down
                // event.code is usually 1006 in this case
                console.log('%c[OBS] Connection died',OBS_LogStyle);
                alert("La connessione a OBS è terminata");
            }
        };

        socket.onerror = function(error) {
            console.log(`%c[OBS error]`,OBS_LogStyle);
            alert("Errore server OBS... ");
        }; 

        py_sock.onopen = function(e) {
            console.log("%c[Python] Py Connection established",PY_LogStyle); 
        };

        py_sock.onmessage = function(event) {
            console.log({"[Python] Data received from  Py server:": JSON.parse(event.data)});
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
                    console.log("%c-#-#-[ SERVER PYTHON PRONTO AL FUNZIONAMENTO ]-#-#-",PY_LogStyle);
                    setInterval(file_read(),5);
                }else{
                    console.log("%c-!-!-[ IL SERVER PYTHON HA RIFIUTATO LA CONNESSIONE]-!-!-",PY_LogStyle);
                }
            }else if(JSON.parse(event.data)["code"] == "[Read]"){
                $("#Punti1").html(JSON.parse(event.data)["val"][0]);
                $("#Punti2").html(JSON.parse(event.data)["val"][1]);
                $("#Set1").html(JSON.parse(event.data)["val"][2]);
                $("#Set2").html(JSON.parse(event.data)["val"][3]);
                RunAutoPilot();
            }
        };

        py_sock.onclose = function(event) {
            if (event.wasClean) {
                console.log(`%c[Python] Py Connection closed cleanly, code=${event.code} reason=${event.reason}`,PY_LogStyle);
            } else {
                // e.g. server process killed or network down
                // event.code is usually 1006 in this case
                console.log('%c[Python] Py Connection died',PY_LogStyle);
                alert("La connessione a Python è terminata");
            }
        };

        py_sock.onerror = function(error) {
            console.log(`%c[Python error]`,PY_LogStyle);
            alert("Errore server Python... ");
        }; 

        function RunAutoPilot(reset = false, tieBreak = true, aggiornaPunti = true){
            if(! AP_Enable) return;

            if(reset && lastWinner){
                update("Set"+lastWinner , 1);
                console.log("%c[AutoPilot]: Aumentato numero Set squadra "+lastWinner, AP_LogStyle);
                lastWinner = 0;
            }

            if(tieBreak){
                tb_check = ((parseInt($("#Set1").html(), 10) + parseInt($("#Set2").html(), 10)) < 4)? FullGoal : HalfGoal;
                if(tb_check != Goal){
                    Goal = tb_check;
                    console.log("%c[AutoPilot]: Cambio Goal Tie Break ("+Goal+")", AP_LogStyle);
                }
            }
            $("#goal").val("Goal: "+Goal);
            
            if(aggiornaPunti){
                let P1 = parseInt($("#Punti1").html(), 10);
                let P2 = parseInt($("#Punti2").html(), 10);
                let P_max = Math.max(P1, P2);
                let P_min = Math.min(P1, P2);

                if((P_max >= Goal) && (P_max - P_min >= 2)){
                    //Win
                    if (Show_STATE == "FineSet") return;
                    lastWinner = (P1 > P2)? 1 : 2;
                    console.log("%c[AutoPilot]: Mostro FineSet",AP_LogStyle);
                    console.log("%c[AutoPilot]: La squadra "+lastWinner+" vince il set",AP_LogStyle);
                    toggle("FineSet", true);
                    $("#goal").val("Goal: "+P_max);
                    Show_STATE = "FineSet";
                }else if((P_max >= Goal - 1) && (P_max - P_min >= 1)){
                    //Matchpoint
                    if (Show_STATE == "Matchpoint") return;
                    console.log("%c[AutoPilot]: Mostro SetPoint",AP_LogStyle);
                    toggle("Matchpoint", true);
                    $("#goal").val("Goal: "+(P_max + 1));
                    Show_STATE = "Matchpoint";
                }else if((P_max >= Goal - 1) && (P_max == P_min)){
                    //Pair
                    if (Show_STATE == "None") return;
                    console.log("%c[AutoPilot]: Aggiornamento Goal",AP_LogStyle);
                    console.log("%c[AutoPilot]: Nascondo FineSet e SetPoint",AP_LogStyle);
                    toggle("FineSet", false);
                    toggle("Matchpoint", false);
                    $("#goal").val("Goal: "+(P_max + 2));
                    Show_STATE = "None";
                }else if ((Show_STATE != "None")){
                    //none
                    console.log("%c[AutoPilot]: Reset Goal",AP_LogStyle);
                    console.log("%c[AutoPilot]: Nascondo FineSet e SetPoint",AP_LogStyle);
                    toggle("FineSet", false);
                    toggle("Matchpoint", false);
                    $("#goal").val("Goal: "+Goal);
                    Show_STATE = "None";
                }
            }
        }

        function file_read(){
            let command = {"code":"[Read]"};
            py_sock.send(JSON.stringify(command));
        }

        function update(campo, progressivo){
            let command = {"code":"[Write]", "val":{"campo":campo,"progressivo":progressivo}};
            py_sock.send(JSON.stringify(command));
        }

        function reset(){
            let Flag_AP = (AP_Enable && lastWinner)? "\nAutoPilot aumenterà il numero di set della squadra "+lastWinner : "";
            if(confirm("Sei sicuro di voler resettare i punti?" + Flag_AP)){
                let command = {"code":"[Reset]"};
                py_sock.send(JSON.stringify(command));
                RunAutoPilot(true);
            }
        }
        
        function toggle(name, value, rescanVis = true, scena = "Punteggio"){
            if(value && now_showed != name){
                toggle(now_showed, false, false);
                sleep(250);
            }else if((!value && !now_showed) || (value && now_showed == name)){
                return;
            }
            
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
            var prefix_to_hide = (value) ? "M" : "N";
            var prefix_to_show = (value) ? "N" : "M";
            $("#"+prefix_to_hide+name).hide();
            $("#"+prefix_to_show+name).show();
            if(value){
                now_showed = name;
            }else if(now_showed == name){
                now_showed = 0;
            }
            if(rescanVis){
                setTimeout(getVisibility, 3000);
            }

        }

        function getVisibility(scena = "Punteggio"){
            console.log("#### Get Visibility");
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

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

    }catch(e){
        alert("Qualcosa è andato storto... " + e);
    }
//}

$("p").addClass("user-select-none"); //Cursore

$('#AP_Sw').change(function() {
    if(this.checked) {
        console.log("%c[Autopilot]: Abilitato",AP_LogStyle);
        AP_Enable = true;
        RunAutoPilot();
    }else{
        if(confirm("Sei sicuro di voler disattivare AutoPilot?")){
            console.log("%c[Autopilot]: Disabilitato",AP_LogStyle);
            AP_Enable = false
            $("#goal").val("--");
        }else{
            $('#AP_Sw').prop("checked",true);
        }
    }
});
