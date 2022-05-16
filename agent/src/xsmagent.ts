import {newXsm, XSM} from "./sm3w-util.js";
import dgram from "node:dgram";

// const server = dgram.createSocket('udp4');
class udpBroker {
    constructor(
	public sm:XSM,
	public bport = 8125,
        public encoder: TextEncoder = new TextEncoder(),
        public decoder: TextDecoder = new TextDecoder(),
        public server = dgram.createSocket("udp4"),
    ) {
        this.server.on("error", (err) => {
            console.log(`server error:\n${err.stack}`);
            this.server.close();
        });

        this.server.on("message", async (msg, rinfo) => {
            console.log(
                `server got: ${msg}, len: ${msg.length}, from ${rinfo.address}:${rinfo.port}`,
            );
            if (msg.length > 0) {
                await this.on_mesg(msg, rinfo);
            }
        });

        this.server.on("listening", () => {
            const address = this.server.address();
            console.log(`server listening ${address.address}:${address.port}`);
        });
    }

    async on_mesg(msg: Buffer, rinfo: dgram.RemoteInfo) {
        try {
            let jmsg = JSON.parse(this.decoder.decode(msg));
            let client_addr = rinfo;
            console.log(jmsg);
            // '{"cmd": "login"}'
            switch (jmsg.cmd) {
                case "login":
                    const user: string = jmsg.user;
                    const passwd: string = jmsg.passwd;
                    await this.sm.iLogin(user, passwd);
                    break;
                case "favorateList":
                    let favors = await this.sm.getFavorateList();
                    await this.send_array(favors, client_addr);
                    break;
                case "allBoardList":
                    let board_array = await this.sm.getBoardList();
                    await this.send_array(board_array, client_addr);
                    // await initBoardTbl(board_array);
                    break;
                case "browseBoard":
                    break;
                case "browseTopic":
                    break;
                case "quit":
                    // socket.send(encoder.encode("OK"), client_addr);
                    // quit = 1;
            }
        } catch (err) {
            console.log(err);
        }
    }
    async send_array<T>(adata: Array<T>, dest: dgram.RemoteInfo | null) {
        if (adata.length > 0) {
            const len = await this.send_data(adata, null);
            await this.send_data(len, dest);
            await this.send_data(adata, dest);
        } else {
            const len = 0;
            await this.send_data(len, dest);
        }
    }
    async send_data(adata: any, dest: dgram.RemoteInfo | null) {
        let data: Uint8Array = this.encoder.encode(JSON.stringify(adata)); //
        const len = data.length;
        console.log("obj json's len: ", len);
        if (!dest) return len;
        var left = len;
        var end = 0;
        var index = 0;
        do {
            if (left > 1000) {
                left -= 1000;
                end += 1000;
            } else {
                left = 0;
                end = len;
            }
            // await socket.send(data.slice(index, end), dest);
            this.server.send(data, index, end - index, dest.port, dest.address);
            index = end;
        } while (left > 0);
    }
    start() {
        console.log("xSM agent starting receive command");
        this.server.bind(this.bport);
        this.server.ref();
    }
}
let sm0 = await newXsm()
let server = new udpBroker(sm0, 8125);
server.start();
server.sm.rest();
