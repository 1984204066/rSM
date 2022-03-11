use cookie_store::CookieStore;
use reqwest_cookie_store::*;
use std::sync::Arc;

pub struct XsmAgent {
    no_cookie: bool,
    cookie_store: Arc<CookieStoreMutex>,
    client: Option<reqwest::blocking::Client>,
}

impl Default for XsmAgent {
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
impl XsmAgent {
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
    let xa = &mut XsmAgent::default();
    xa.xsm_login("txgx", "hello");
}
