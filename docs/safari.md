# Safari

Lares is built as a standard Web Extension; Safari support is produced with Apple's packager. This needs full Xcode (not just the Command Line Tools).

1. Install Xcode from the App Store and open it once.
2. From the repository root:
   ```sh
   xcrun safari-web-extension-packager extension --project-location safari \
     --app-name "Lares" --bundle-identifier <your.bundle.id> --swift --no-open
   ```
3. Open the generated project in `safari/`, build and run the macOS app.
4. Safari → Settings → Advanced → enable "Show features for web developers", then Develop → **Allow unsigned extensions**.
5. Safari → Settings → Extensions → enable Lares.

Notes:
- Safari asks for site access per site (once, for a day, or always), even after you enable Lares in the popup.
- Safari drops registered content scripts on extension updates; Lares re-registers enabled sites on install/startup.
- Storage is unlimited only with the `unlimitedStorage` permission, which Lares declares.
- Testing locally is free. Distributing through the App Store requires the Apple Developer Program.
