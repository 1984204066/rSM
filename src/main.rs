#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")] // hide console window on Windows in release

use board_panel::BoardPanel;
use eframe::egui::{self, CollapsingHeader, Direction, Layout};
use eframe::epi::{self, App};
use ilogin::ILoginApp;
mod board_panel;
mod ilogin;

struct XsmApp {
    board_panel: BoardPanel,
    ilogin: ILoginApp,
}
impl Default for XsmApp {
    fn default() -> Self {
        Self {
            board_panel: Default::default(),
            ilogin: Default::default(),
        }
    }
}

impl epi::App for XsmApp {
    fn name(&self) -> &str {
        "锈 水木"
    }

    fn setup(
        &mut self,
        ctx: &egui::Context,
        _frame: &epi::Frame,
        _storage: Option<&dyn epi::Storage>,
    ) {
        #[cfg(feature = "persistence")]
        if let Some(storage) = _storage {
            *self = epi::get_value(storage, epi::APP_KEY).unwrap_or_default();
        }

        // Start with the default fonts (we will be adding to them rather than replacing them).
        let mut fonts = egui::FontDefinitions::default();
        let msyh = "msyh".to_owned();
        // Install my own font (maybe supporting non-latin characters).
        // .ttf and .otf files supported.
        fonts.font_data.insert(
            msyh.clone(),
            egui::FontData::from_static(include_bytes!("../../.fonts/msyh.ttf")),
        );

        // Put my font first (highest priority) for proportional text:
        fonts
            .families
            .entry(egui::FontFamily::Proportional)
            .or_default()
            .insert(0, msyh.clone());

        // Put my font as last fallback for monospace:
        fonts
            .families
            .entry(egui::FontFamily::Monospace)
            .or_default()
            .push(msyh.clone());

        // Tell egui to use these fonts:
        ctx.set_fonts(fonts);
    }

    fn update(&mut self, ctx: &egui::Context, frame: &epi::Frame) {
        egui::TopBottomPanel::bottom("bottom_panel").show(ctx, |ui| {
            self.bottom_panel_ui(ui);
        });
        if self.board_panel.open {
	    self.board_panel.update(ctx, frame);
        }
        self.ilogin.update(ctx, frame);
        // egui::TopBottomPanel::bottom("stat_panel").show(ctx, |ui| {
        //     self.avatar_ui(ui);
        // });

        // Resize the native window to be just the size we need it to be:
        frame.set_window_size(ctx.used_size());
    }
}
impl XsmApp {
    fn bottom_panel_ui(&mut self, ui: &mut eframe::egui::Ui) {
        ui.horizontal(|ui| {
            ui.checkbox(&mut self.board_panel.open, "💻现锈/总锈(1/1)");
            ui.separator();
            ui.button("🔍 Find");
            ui.separator();
            ui.button("🔧 Settings");
            ui.separator();
            ui.horizontal(|ui| {
                ui.with_layout(egui::Layout::right_to_left(), |ui| {
                    ui.button("✨ Who");
                });
            });
        });
    }
    fn avatar_ui(&mut self, ui: &mut eframe::egui::Ui) {
        egui::Frame::popup(ui.style())
            .stroke(eframe::epaint::Stroke::none())
            .show(ui, |ui| {
                ui.set_max_width(270.0);
                CollapsingHeader::new("✨ Who").show(ui, |ui| self.own_settings_ui(ui));
            });
    }
    fn own_settings_ui(&mut self, ui: &mut eframe::egui::Ui) {}
}

fn main() {
    let app = XsmApp::default();
    let options = eframe::NativeOptions {
        // Let's show off that we support transparent windows
        transparent: true,
        drag_and_drop_support: true,
        ..Default::default()
    };
    eframe::run_native(Box::new(app), options);
}
