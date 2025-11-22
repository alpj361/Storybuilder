# Environment Variables Instruction

When working with Expo cloud builds (EAS Build) or Development Clients, standard `.env` files often fail to load correctly because they are ignored by git or the build process doesn't pick them up in time.

## The Robust Solution: `env.json`

Do NOT rely on `dotenv` or `process.env` for critical API keys in cloud builds. Instead:

1. **Create `env.json`** in the project root:
   ```json
   {
     "EXPO_PUBLIC_SUPABASE_URL": "your-url",
     "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-key"
   }
   ```

2. **Import directly in `app.config.js`**:
   ```javascript
   const env = require('./env.json');
   
   module.exports = ({ config }) => ({
     ...config,
     extra: {
       ...env
     }
   });
   ```

3. **Import directly in source code** (e.g., `supabaseClient.ts`):
   ```typescript
   // @ts-ignore
   import env from '../../env.json';
   
   const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
   ```

This approach guarantees that variables are bundled with the app and available in all environments.
