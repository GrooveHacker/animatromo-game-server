# Animatromo Game Server
The server for [Animatromo Game](https://animatromo-game.netlify.app).

## Usage

#### Running the server

Clone the repo
```bash
  git clone https://github.com/GrooveHacker/animatromo-game-server.git
  cd animatromo-game-server
```

<br>

Run the server
```bash
  node server.js <port>
```

<br>

#### Tunneling
The game uses TLS to connect securely to your game server and will refuse an insecure connection.<br>
Use a service like **[ngrok](https://ngrok.com/)** to provide a secure tunnel, with the added bonus of playing with your friends across the internet!<br>

Set up **ngrok** and start the tunnel
```bash
  ngrok http <port>
```

<br>

#### Connecting to the server
In the **server address** field, input the url of your server.
In the case of **ngrok**, that would look like<br>
```abcd-efgh-ijkl-mnop-qrst-uvwx-yz12-3456-7890.ngrok-free.app```<br><br>
Remove any slashes, as well as http:// or https:// before connecting.
