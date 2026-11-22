// Fixed-size exports keep browser glue small and require no runtime imports.
#[unsafe(no_mangle)]
pub extern "C" fn theme(code: u32) -> u32 {
    match code {
        1 => 0x111613,
        2 => 0xeedfca,
        _ => 0xf5f4ef,
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn select(mask: u32, service: u32, checked: u32) -> u32 {
    let Some(bit) = 1_u32.checked_shl(service) else {
        return mask;
    };
    if checked == 0 {
        mask & !bit
    } else {
        mask | bit
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn selected(mask: u32, service: u32) -> u32 {
    u32::from(
        1_u32
            .checked_shl(service)
            .is_some_and(|bit| mask & bit != 0),
    )
}

fn points(seed: &mut u32) -> f64 {
    *seed = seed.wrapping_mul(1_664_525).wrapping_add(1_013_904_223);
    f64::from(*seed) / 4_294_967_296.
}

const SCRATCHES: usize = 1800;
const FLAKES: usize = 5600;
static mut SURFACE: [f64; SCRATCHES * 6 + FLAKES * 3] = [0.; SCRATCHES * 6 + FLAKES * 3];

#[unsafe(no_mangle)]
pub extern "C" fn surface() -> *const f64 {
    let mut seed = 98_317;
    let surface = &raw mut SURFACE;
    // Called once before the browser reads the fixed sample from linear memory.
    let output = unsafe { &mut *surface };
    let (scratches, flakes) = output.split_at_mut(SCRATCHES * 6);
    for mark in scratches.chunks_exact_mut(6) {
        mark.copy_from_slice(&[
            points(&mut seed),
            points(&mut seed),
            0.012 + points(&mut seed) * 0.09,
            points(&mut seed) * std::f64::consts::TAU,
            0.12 + points(&mut seed) * 1.45,
            0.16 + points(&mut seed) * 0.84,
        ]);
    }
    for flake in flakes.chunks_exact_mut(3) {
        flake.copy_from_slice(&[
            points(&mut seed),
            points(&mut seed),
            0.1 + points(&mut seed) * 0.8,
        ]);
    }
    surface.cast()
}

#[unsafe(no_mangle)]
pub extern "C" fn light_percent(offset: f64, width: f64) -> u32 {
    (100. * offset / width).round().clamp(0., 100.) as u32
}

#[unsafe(no_mangle)]
pub extern "C" fn scratch_alpha(dx: f64, dy: f64, depth: f64, corrected: u32) -> f64 {
    if corrected != 0 && depth < 0.92 {
        return 0.;
    }
    let exposure = (1. - dx.hypot(dy)).max(0.);
    exposure * exposure * depth * if corrected != 0 { 0.20 } else { 0.9 }
}
