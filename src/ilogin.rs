use eframe::egui::{self, Color32, Direction, DragValue, Layout, RichText};
use egui_extras::RetainedImage;
use super::xsm::{xSMAgent, GlobalAgent};

pub struct ILoginApp {
    image: RetainedImage,
    name: String,
    passwd: String,
    age: u32,
}

impl Default for ILoginApp {
    fn default() -> Self {
        Self {
            image: RetainedImage::from_image_bytes("smth.jpg", include_bytes!("../smth.jpg"))
                .unwrap(),
            name: "input your name e.g. Arthur".to_owned(),
            passwd: "password".to_owned(),
            age: 42,
        }
    }
}

impl eframe::App for ILoginApp {
    // fn name(&self) -> &str {
    //     "锈 俺来了"
    // }

    fn update(&mut self, ctx: &egui::Context, frame: &mut eframe::Frame) {
        egui::CentralPanel::default().show(ctx, |ui| {
            self.login_ui(ui);
        });
        // Resize the native window to be just the size we need it to be:
        // frame.set_window_size(ctx.used_size());
    }
}

impl ILoginApp {
    fn login_ui(&mut self, ui: &mut eframe::egui::Ui) {
        ui.horizontal(|ui| {
            // ui.heading("现锈/总锈 = 1/1");
            // ui.separator();
            // ui.heading("Welcome to 锈 水木");
            ui.with_layout(egui::Layout::right_to_left(), |ui| {
                ui.button("🔥Top 贴");
            });
        });
        let rect = ui.available_rect_before_wrap();
        let widget_vec2 = ui.available_size_before_wrap();

        // self.image.show_max_size(ui, widget_vec2);
        // let widget_rect = egui::Rect::from_min_size(ui.min_rect().min, [0.0, 0.0]);
        let grid = egui::Grid::new("User login");
        // ui.put(rect, grid);
        // let widget_rect =
        //     egui::Rect::from_min_size(ui.min_rect().min, egui::Vec2::new(200.0, 10.0)
        //);
        grid.show(ui, |ui| {
            ui.separator();
            // ui.add(egui::Separator::default().spacing(200.0));
            ui.add_sized([200.0, 6.0], egui::Separator::default().horizontal());
            ui.end_row();
            ui.label("name: ");
            ui.text_edit_singleline(&mut self.name);
            // ui.add(egui::TextEdit::singleline(&mut self.name).desired_width(200.0));
            // ui.add_sized([200.0, 18.0], egui::TextEdit::singleline(&mut self.name).desired_width(200.0));
            ui.end_row();
            ui.label("password: ");
            ui.text_edit_singleline(&mut self.passwd);
            ui.end_row();
        });
        ui.horizontal(|ui| {
            if ui.button("Sign on").clicked() {
		GlobalAgent::login(&self.name, &self.passwd);
		GlobalAgent::favorate_boards();
            }
            ui.hyperlink_to("注册新用户", "http://www.mysmth.net/");
            // ui.label(format!("Hello '{}', age {}", self.name, self.age));
            ui.selectable_label(
                false,
                RichText::new("俺不说话，只瞅一眼").color(Color32::LIGHT_BLUE),
            );
        });
    }
}
