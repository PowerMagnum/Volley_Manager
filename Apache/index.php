<html>
 <head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/css/bootstrap.min.css" integrity="sha384-TX8t27EcRE3e/ihU7zmQxVncDAy5uIKz4rEkgIXeMed4M0jlfIDPvg6uqKI2xXr2" crossorigin="anonymous">
  <link rel="stylesheet" href="index.css">
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
  <title>Volley Manager</title>
  <script src="cookie.js"></script>
 </head>



 <body id="Body" class="d-flex align-items-center justify-content-center">
  <div id="id01" class="modal">
    <div class="modal-content animate">
      <div class="container" style=" padding: 16px;">
        <label for="code"><b>IP</b></label>
        <input type="text" style="width: 100%; padding: 12px 20px; margin: 8px 0; display: inline-block; border: 1px solid #ccc; box-sizing: border-box;" placeholder="Inserisci indirizzo Ip" autocomplete="ip" id="ip" name="ip" required>
        <label for="code"><b>Codice</b></label>
        <input type="text" style="width: 100%; padding: 12px 20px; margin: 8px 0; display: inline-block; border: 1px solid #ccc; box-sizing: border-box;" placeholder="Inserisci codice di accesso" autocomplete="code" id="code" name="code" required>
        <button type="submit" onclick="connect()" style="background-color: #4CAF50; color: white; padding: 14px 20px; margin: 8px 0; border: none; cursor: pointer; width: 100%; " >Login</button>
      </div>
    </div>
  </div>

  <script>
    //connect($('#code').val(), $('#ip').val())
  $(document).ready(function() {
        $("#ip").val(getCookie("IP"));
        $("#code").val(getCookie("CODE"));
        document.getElementById('id01').style.display='block';
    });
  </script>
</body>
<script>
  function connect(){
    psw = $('#code').val();
    ip = $('#ip').val();
    $("#Body").load("view.html");
  }
</script>

</html>
