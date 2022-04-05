#![feature(once_cell)]
use cookie_store::CookieStore;
use reqwest_cookie_store::*;
use std::net::UdpSocket;
use std::net::{IpAddr, Ipv4Addr, SocketAddr};
use std::sync::Arc;
use std::thread::{self, JoinHandle};
// use std::rc::Rc;
// use std::ops::{Deref, DerefMut};
use serde_json::{json, Result};
//use once_cell::sync::Lazy;
// use lazy_static::lazy_static;
use lazy_static::lazy_static;
use std::sync::Mutex;
lazy_static! {
    static ref XSM:Mutex<PuppeteerAgent> = Mutex::new(PuppeteerAgent::default());
    // static ref ARRAY: Mutex<Vec<u8>> = Mutex::new(vec![]);
}

pub struct GlobalAgent {}
impl GlobalAgent {
    pub fn start() {
        XSM.lock().unwrap().start();
    }
    pub fn stop() {
        XSM.lock().unwrap().stop();
    }
    pub fn login(u: &str, passwd: &str) {
        XSM.lock().unwrap().login(u, passwd);
    }
    pub fn favorate_boards() -> Vec<Board> {
        let mut vb: Vec<Board> = vec![];
        XSM.lock().unwrap().favorate_boards(&mut vb);
        vb
    }
    fn all_boards() -> Vec<Board> {
        let mut vb: Vec<Board> = vec![];
        XSM.lock().unwrap().all_boards(&mut vb);
        vb
    }
}

// static GLOBAL_XSM : Lazy<Mutex<Arc<dyn xSMAgent>>> = Lazy::new(|| {
//     let  data =  PuppeteerAgent::default();
//     Mutex::new(Arc::new(data))
// });
// static GLOBAL_XSM : Box<dyn xSMAgent>;

//use std::thread;

// lazy_static! {
//     static ref GLOBAL_XSM : Mutex<&mut dyn xSMAgent> = Mutex::new(PuppeteerAgent::default());
// }

pub struct Board {}
pub struct Topic {}
pub struct Ariticle {}
pub trait xSMAgent {
    fn start(&mut self);
    fn stop(&mut self);
    fn login(&mut self, u: &str, passwd: &str);
    // immediate login.
    // fn ilogin(&self);
    fn favorate_boards(&self, vb: &mut Vec<Board>);
    fn all_boards(&self, vb: &mut Vec<Board>);
    // fn some_topics(&self, board: &Board, pagei: i32) -> &[Topic];
    // fn all_topics(&self, board: &Board) -> &[Topic];
    // fn some_debates(&self, topic: &Topic, pagei: i32) -> &[Ariticle];
    // fn all_debates(&self, topic: &Topic) -> &[Ariticle];
}

pub struct PuppeteerAgent {
    socket: Option<UdpSocket>,
    // socket: UdpSocket,
    // peer: Option<Ipv4Addr>,
    peer: SocketAddr,
    user: String,
    passwd: String,
    xm_thread: Option<JoinHandle<()>>,
    favorate_boards: Vec<Board>,
    all_boards: Vec<Board>,
}

impl Default for PuppeteerAgent {
    fn default() -> Self {
        Self {
            socket: None,
            peer: SocketAddr::new(IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1)), 8125),
            user: String::new(),
            passwd: String::new(),
            xm_thread: None,
            favorate_boards: Vec::new(),
            all_boards: Vec::new(),
        }
    }
}
#[derive(serde::Serialize, Default)]
struct Cmd {
    cmd: String,
}

impl xSMAgent for PuppeteerAgent {
    fn start(&mut self) {
        use std::process::Command;
        let socket = UdpSocket::bind("127.0.0.1:8126").expect("couldn't bind to address");
        self.socket = Some(socket);
        // self.xm_thread = Some(thread::spawn(move || loop {
        //     Command::new("sh").arg("-c")
        //     .arg("deno run -A --unstable xsmagent.tsx");
        // }));
    }

    fn stop(&mut self) {
        let mut buf = [0u8; 1500];
        // let (amt, src) = self.socket.unwrap().recv_from(&mut buf)?;
        // let buf = &mut buf[..amt];
        // buf.reverse();
        let cmd = r#"{"cmd":"quit"}"#.as_bytes();
        self.socket.as_ref().unwrap().send_to(cmd, self.peer);
        self.xm_thread.take().map(JoinHandle::join);
        let (amt, src) = self.socket.as_ref().unwrap().recv_from(&mut buf).unwrap();
    }

    fn login(&mut self, u: &str, pass: &str) {
        #[derive(serde::Serialize, Default)]
        struct Login {
            cmd: String,
            user: String,
            passwd: String,
        }
        let cmd = Login {
            cmd: "login".to_string(),
            user: u.to_string(),
            passwd: pass.to_string(),
        };
        let cmd = serde_json::to_string(&cmd).unwrap();
        let cmd = cmd.as_bytes();

        self.socket.as_ref().unwrap().send_to(cmd, self.peer);
    }
    fn favorate_boards(&self, vb: &mut Vec<Board>) {
        let cmd = Cmd {
            cmd: "favorateList".to_string(),
        };
        let cmd = serde_json::to_string(&cmd).unwrap();
        let cmd = cmd.as_bytes();

        self.socket.as_ref().unwrap().send_to(cmd, self.peer);
        #[derive(serde::Deserialize, Default, Debug)]
        struct Favor {
            href: String,
            title: String,
        }
        let mut buf0 = [0u8; 1024];
        let (amt, src) = self.socket.as_ref().unwrap().recv_from(&mut buf0).unwrap();
        let len: i32 = serde_json::from_slice(&buf0[..amt]).unwrap();
        if len == 0 {
            return;
        };
	let mut left = len as usize;
        let mut buf = vec![0; left];
        buf.reserve(left);
        println!(
            "receive amt = {amt}, {:#?}, {len} and reserved for buf",
            &buf0[..amt]
        );
	let mut buf0 = &mut buf[..left];
        loop {
	    println!("{left}");
	    let (amt, src) = self.socket.as_ref().unwrap().recv_from(buf0).unwrap();
	    println!("received one chunk {amt}");
	    left -= amt;
	    if left <= 0 {
		break;
	    }
	    buf0 = &mut buf0[amt..]
        }

        let res: Vec<Favor> = serde_json::from_slice(&buf[..]).unwrap();
        // return &self.favorate_boards;
        println!("vec length {}, {:#?}", res.len(), res);
    }

    fn all_boards(&self, vb: &mut Vec<Board>) {
        // return &self.all_boards;
    }
}

pub struct ReqwestAgent {
    no_cookie: bool,
    cookie_store: Arc<CookieStoreMutex>,
    client: Option<reqwest::blocking::Client>,
}

impl Default for ReqwestAgent {
    fn default() -> Self {
        let nocookie;
        // Load an existing set of cookies, serialized as json
        let cookiestore = {
            match std::fs::File::open("cookies.json")
                .map(std::io::BufReader::new)
                .map(CookieStore::load_json)
            {
                Ok(cookie) => {
                    nocookie = false;
                    cookie.unwrap()
                }
                Err(..) => {
                    nocookie = true;
                    println!("Error on cookie file");
                    std::fs::File::create("cookies.json");
                    CookieStore::default()
                }
            }
        };
        let cookiestore = Arc::new(CookieStoreMutex::new(cookiestore));
        // Build a `reqwest` Client, providing the deserialized store
        let xa = reqwest::blocking::Client::builder()
            .cookie_provider(Arc::clone(&cookiestore))
            .build()
            .unwrap();
        Self {
            no_cookie: nocookie,
            cookie_store: cookiestore,
            client: Some(xa),
        }
    }
}
impl ReqwestAgent {
    fn xsm_login(&mut self, name: &str, pass: &str) {
        // Having passwd, so clear the store, and examine again
        {
            let mut store = self.cookie_store.lock().unwrap();
            store.clear();
        }
        let res = self
            .client
            .as_ref()
            .unwrap()
            .post("https://www.mynewsmth.net/nForum/#!login")
            .body(r#"name="txgx", password="meinv""#)
            .send();
        match res {
            Ok(response) => {
                // Examine the contents of the store.
                {
                    println!("after GET mynewsmth");
                    let store = self.cookie_store.lock().unwrap();
                    for c in store.iter_any() {
                        println!("{:?}", c);
                    }
                }
                // Write store back to disk
                let mut writer = std::fs::File::create("cookies.json")
                    .map(std::io::BufWriter::new)
                    .unwrap();
                {
                    let store = self.cookie_store.lock().unwrap();
                    store.save_json(&mut writer).unwrap();
                }
                // let content = response.text().unwrap();
                // println!("{content}");
            }
            Err(err) => {
                println!("Some thing wrong {err}");
            }
        };
    }
}

#[test]
fn test_ok() {
    // let xa = &mut ReqwestAgent::default();
    // xa.xsm_login("txgx", "hello");
    let mut xa = get_xsm_agent();
    // println!("{:#?}", xa)
    xa.start();
    xa.login("txgx", "meinv")
}
