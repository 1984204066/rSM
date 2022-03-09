use eframe::egui::{self, CollapsingHeader, Direction, Layout};
use eframe::epi;

use std::collections::HashMap;

pub struct BoardPanel {
    pub open: bool,
    all_boards: HashMap<String, Vec<String>>,
    favorate: Vec<String>,
}
impl Default for BoardPanel {
    fn default() -> Self {
        let catigory = vec!["computer", "sports", "express"];
        let catigory: Vec<String> = catigory.into_iter().map(String::from).collect();
        let items: Vec<String> = vec!["111", "222", "333"]
            .into_iter()
            .map(String::from)
            .collect();
        let boards = vec![items.clone(), items.clone(), items.clone()];
        let map: HashMap<_, _> = catigory
            .clone()
            .into_iter()
            .zip(boards.into_iter())
            .collect();
        Self {
            open: false,
            all_boards: map,
            favorate: catigory,
        }
    }
}

impl epi::App for BoardPanel {
    fn name(&self) -> &str {
        "锈 的版面"
    }

    fn update(&mut self, ctx: &egui::Context, frame: &epi::Frame) {
        egui::SidePanel::left("left_panel")
            .min_width(110.0)
            .default_width(150.0)
            .show(ctx, |ui| {
                self.panel_ui(ui);
            });
    }
}

impl BoardPanel {
    pub fn panel_ui(&mut self, ui: &mut eframe::egui::Ui) {
        // ui.allocate_ui(
        //     vec2(ui.available_size_before_wrap().x, self.wrap_row_height),
        //     |ui| ui.with_layout(self.layout.layout(), demo_ui),
        // );
        ui.heading("锈 所有版面");
	ui.collapsing("All Boards", |ui| self.all_boards(ui));
	ui.collapsing("My Favorate", |ui| self.favorate_boards(ui));
        // ui.with_layout(egui::Layout::bottom_up(eframe::emath::Align::Min), |ui| {
        // });
    }
    fn all_boards(&mut self, ui: &mut eframe::egui::Ui) {
        for catigory in &self.all_boards {
            ui.collapsing(catigory.0.clone(), |ui| {
                show_boards(ui, catigory.1);
            });
        }
    }

    fn favorate_boards(&mut self, ui: &mut eframe::egui::Ui) {
        show_boards(ui, &self.favorate);
    }
}
fn show_boards(ui: &mut eframe::egui::Ui, boards: &Vec<String>) {
    for board in boards {
        ui.label(board);
    }
}
