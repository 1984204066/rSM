use crate::ilogin::*;
use crate::xsm::XsmAgent;
use eframe::egui::{self, CollapsingHeader, Direction, Layout, ScrollArea};
use eframe::epi;
use std::collections::HashMap;
use std::rc::Rc;
#[derive(Default)]
pub struct BoardPanel {
    xa: Rc<XsmAgent>,
    egui_windows: PanelWindows,
    side_panel: SidePanel,
    ilogin: ILoginApp,
}

impl epi::App for BoardPanel {
    fn name(&self) -> &str {
        "锈の控"
    }

    fn update(&mut self, ctx: &egui::Context, frame: &epi::Frame) {
        if self.egui_windows.open_board {
            egui::SidePanel::left("left_panel")
                .min_width(110.0)
                .default_width(150.0)
                .show(ctx, |ui| {
                    self.side_panel.ui(ui);
                });
        }
        self.ilogin.update(ctx, frame);
    }
}
impl BoardPanel {
    pub fn new(xsm: Rc<XsmAgent>) -> Self {
        Self {
            xa: xsm,
            egui_windows: Default::default(),
            side_panel: Default::default(),
            ilogin: Default::default(),
        }
    }
    pub fn ui(&mut self, ui: &mut eframe::egui::Ui) {
        self.egui_windows.checkboxes(ui);
    }
    pub fn end_of_frame(&mut self, ctx: &egui::Context) {
        self.egui_windows.windows(ctx);
    }
}
pub struct SidePanel {
    choose: i8,
    all_boards: HashMap<String, Vec<String>>,
    favorate: Vec<String>,
}
impl Default for SidePanel {
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
            choose: 1,
            all_boards: map,
            favorate: catigory,
        }
    }
}

impl SidePanel {
    pub fn ui(&mut self, ui: &mut eframe::egui::Ui) {
        ScrollArea::vertical().show(ui, |ui| {
            let layout = &mut self.choose;
            ui.horizontal(|ui| {
                ui.selectable_value(layout, 1i8, "Favorate");
                ui.selectable_value(layout, 2i8, "All☰");
            });
            ui.separator();
            // ui.heading("锈の所有版面");
            match layout {
                1 => self.favorate_boards(ui),
                _ => self.all_boards(ui),
            }
        });
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

#[cfg_attr(feature = "serde", derive(serde::Deserialize, serde::Serialize))]
struct PanelWindows {
    // egui stuff:
    pub open_board: bool,
    pub open_who: bool,
    pub open_settings: bool,
    pub open_find: bool,
}

impl Default for PanelWindows {
    fn default() -> Self {
        PanelWindows::none()
    }
}

impl PanelWindows {
    fn none() -> Self {
        Self {
            open_board: false,
            open_who: false,
            open_settings: false,
            open_find: false,
        }
    }

    fn checkboxes(&mut self, ui: &mut egui::Ui) {
        let Self {
            open_board,
            open_who,
            open_settings,
            open_find,
        } = self;
        ui.horizontal(|ui| {
            ui.checkbox(open_board, "☰ 现锈/总锈(1/1)");
            ui.separator();
            ui.checkbox(open_settings, "🔧 Settings");
            ui.separator();
            ui.checkbox(open_find, "🔍 Find");
            ui.separator();
            ui.horizontal(|ui| {
                ui.with_layout(egui::Layout::right_to_left(), |ui| {
                    ui.checkbox(open_who, "✨ Who is who");
                });
            });
        });
    }

    fn windows(&mut self, ctx: &egui::Context) {
        let Self {
            open_board,
            open_who,
            open_settings,
            open_find,
        } = self;

        egui::Window::new("xSM 🔧 Settings")
            .open(open_settings)
            .vscroll(true)
            .show(ctx, |ui| ctx.settings_ui(ui));

        egui::Window::new("xSM 🔍 Find")
            .open(open_find)
            .vscroll(true)
            .show(ctx, |ui| ctx.inspection_ui(ui));

        egui::Window::new("xSm ✨ Who is who")
            .open(open_who)
            .resizable(false)
            .show(ctx, |ui| {
                own_settings_ui(ui);
            });
    }
}
fn own_settings_ui(ui: &mut eframe::egui::Ui) {
    let mut layout: i32 = 1;
    ui.horizontal(move |ui| {
        ui.selectable_value(&mut layout, 3, "Top-down");
        ui.selectable_value(&mut layout, 1, "Top-down, centered and justified");
        ui.selectable_value(&mut layout, 2, "Horizontal wrapped");
    });
}
