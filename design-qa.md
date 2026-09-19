# Design QA — TERRASO authentication v2

final result: implementation passed; final runtime visual capture blocked

## Source and implementation

- Selected visual truth: `output/design-auth-v2/terraso-auth-v2-option-3.png` (Moving Horizon).
- Production illustration: `mobile/app_mobile/assets/images/auth_moving_horizon.png`.
- Implemented surfaces: login and three-step registration flow.
- Target language: orange travel panorama, deep ink panels, asymmetric curves, connected credential lanes, route-style progress and white/orange primary action.

## Fidelity review

- Login uses the selected orange illustrated hero, white editorial headline, overlapping dark sheet, connected credential rows and attached circular arrow action.
- Registration uses the same dark/orange palette, asymmetric field panel, route-style numbered progress, large white headings and the same primary action.
- Existing authentication, validation, guest access, date selection and registration payload behavior remain intact.
- Manrope typography, large touch targets and scroll-safe layouts are retained.

## Findings and fixes

1. Replaced the earlier cream/green concept with the selected orange/ink direction.
2. Replaced generic standalone login fields with one connected travel-credential component.
3. Replaced the generic segmented registration progress bar with a connected route indicator.
4. Corrected low-contrast registration progress text and grouped each step inside an asymmetric raised panel.

No known P0 or P1 implementation issue remains. A final screenshot-level P2/P3 comparison could not be completed because the Android emulator reports insufficient storage and the local Flutter Web canvas remains blank in the integrated browser without console errors.

## Verification

- `flutter test`: passed.
- `flutter analyze`: no issue in modified authentication files. Two pre-existing deprecation notices remain in `lib/features/sav/create_sav_ticket_page.dart`.
- Android debug APK build: passed before the final registration polish.
- Android install: blocked by `INSTALL_FAILED_INSUFFICIENT_STORAGE` on emulator-5554.
