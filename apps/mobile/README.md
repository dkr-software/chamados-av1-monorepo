# Atende Mobile

Expo SDK 57 app for requesters and administrators. Requesters can register, open
tickets, and track their own requests. Administrator accounts open a separate
workspace with ticket, people, and equipment management. The API issues the JWT;
the app stores it with Expo SecureStore and sends it as a Bearer token on protected
requests. React Hook Form and Zod validate the forms before submission.

## Start

From the repository root, install dependencies and run the mobile workspace:

```sh
npm install
npm run dev --workspace mobile
```

Root shortcuts are also available: `npm run mobile`, `npm run mobile:android`,
`npm run mobile:ios`, and `npm run mobile:doctor`.

Copy `.env.example` to `.env` before starting Expo. Leave the optional API URL unset
to use `http://localhost:3000` for iOS Simulator and `http://10.0.2.2:3000` for
Android Emulator. A physical phone needs the computer's LAN address (for example,
`http://192.168.1.20:3000`) and must be on the same network.

The API must be running with its database migrated and `JWT_SECRET` configured. For a
native preview, open the project in Expo Go and scan the QR code. Use `npm run android
--workspace mobile` or `npm run ios --workspace mobile` to launch an available
emulator/simulator.

`npm run build --workspace mobile` type-checks the project and exports its Android
JavaScript bundle. This does not create a signed APK or IPA.
