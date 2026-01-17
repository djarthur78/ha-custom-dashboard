# Next Steps - Family Dashboard Development

**Status:** Discovery Phase Complete ✅
**Current Phase:** Ready for Foundation Phase
**Date:** 2026-01-17

---

## Immediate Next Steps (This Week)

### 1. Review Discovery Documentation
**Priority: CRITICAL**
**Time: 30 minutes**

Read and validate the discovery findings:
- [ ] `discovery/01-dashboard-current.md` - Entity analysis
- [ ] `config/entities.json` - Entity mappings
- [ ] `specs/00-mvp-definition.md` - MVP scope

**Questions to Answer:**
- Are all required entities captured?
- Is the MVP scope aligned with your expectations?
- Any missing features from current dashboard?

---

### 2. Set up Google Cloud Project & OAuth
**Priority: HIGH**
**Time: 30 minutes**

**Architecture Decision:** The new React app will connect directly to Google Calendar API (not through HA).

**Action Steps:**
1. Go to https://console.cloud.google.com
2. Create new project (or use existing): "Family Dashboard"
3. Enable Google Calendar API:
   - APIs & Services → Library
   - Search "Google Calendar API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - APIs & Services → Credentials
   - Create Credentials → OAuth client ID
   - Application type: Web application
   - Name: "Family Dashboard React"
   - Authorized JavaScript origins:
     - `http://localhost:5173` (dev)
     - `http://192.168.1.X:5173` (your actual IP)
   - Authorized redirect URIs:
     - `http://localhost:5173`
     - `http://192.168.1.X:5173`
   - Click "Create"
5. Copy the **Client ID** (you'll need this for .env)
6. Configure OAuth consent screen:
   - User Type: Internal (if using Google Workspace) or External
   - Add scopes: `https://www.googleapis.com/auth/calendar.readonly`
   - Add test users: your family Google accounts

**Save for Later:**
- Client ID → will go in .env file as `VITE_GOOGLE_CLIENT_ID`

**Why This Matters:**
- Calendar is #1 priority feature
- Direct API = faster, more reliable than through HA
- Works even if HA is offline

---

### 3. Extract Dashboard Colors (Optional)
**Priority: MEDIUM**
**Time: 20 minutes**

To match the exact look of the current dashboard:

**Action Steps:**
1. Open HA → Settings → Dashboards
2. Find "family calendar - panel" dashboard
3. Click "Edit Dashboard" → "Raw Configuration Editor"
4. Copy the YAML configuration
5. Save to `discovery/02-dashboard-yaml.md`
6. Extract color hex codes from Atomic Calendar Revive config

**Alternative:**
Start with default Tailwind dark theme, iterate based on feedback.

---

### 4. Initialize React Project
**Priority: HIGH**
**Time: 1 hour**

**Action Steps:**
```bash
# Create Vite + React project
npm create vite@latest . -- --template react

# Install dependencies
npm install

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install required packages
npm install zustand date-fns lucide-react @react-oauth/google

# Install dev tools
npm install -D eslint prettier eslint-config-prettier

# Create .env file
echo "VITE_HA_URL=http://192.168.1.2:8123" > .env
echo "VITE_HA_TOKEN=your_long_lived_access_token" >> .env
echo "VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id" >> .env
echo ".env" >> .gitignore

# Test dev server
npm run dev
```

**Expected Outcome:**
- React app running on http://localhost:5173
- Tailwind CSS configured
- Environment variables loaded

---

### 5. Create Long-Lived Access Token
**Priority: HIGH**
**Time: 5 minutes**

**Action Steps:**
1. Open Home Assistant
2. Click your profile (bottom left)
3. Scroll to "Long-Lived Access Tokens"
4. Click "Create Token"
5. Name it: "Family Dashboard Dev"
6. Copy token immediately (shown once!)
7. Paste into `.env` file as `VITE_HA_TOKEN`

**Security Note:**
- Never commit `.env` file to git (already in `.gitignore`)
- Token has full access to your HA instance
- Regenerate if compromised

---

### 6. Test HA Connection
**Priority: HIGH**
**Time: 30 minutes**

Create a test file to verify WebSocket connection:

**Action Steps:**
1. Create `src/services/ha-websocket.js`
2. Implement WebSocket connection
3. Test authentication
4. Test entity subscription
5. Test service calls

**Success Criteria:**
- Can connect to HA
- Can receive entity state updates
- Can call services (e.g., turn light on/off)
- Connection auto-reconnects on disconnect

**Code Reference:**
See Home Assistant WebSocket API docs:
https://developers.home-assistant.io/docs/api/websocket

---

## This Week's Goals (Phase 1: Foundation)

**Goal:** Working HA connection + basic UI framework

**Deliverables:**
- [ ] React + Vite project initialized
- [ ] Tailwind CSS configured
- [ ] HA WebSocket connection working
- [ ] HA REST API wrapper created
- [ ] Basic app layout (header, main, footer)
- [ ] Dark theme implemented
- [ ] Entity state reading works
- [ ] Service calling works
- [ ] Error boundaries implemented
- [ ] Loading states implemented

**Time Estimate:** 8-12 hours of development

---

## Week 2 Goals (Phase 1 Complete)

**Goal:** Solid foundation ready for feature development

**Deliverables:**
- [ ] Routing configured (if multi-page)
- [ ] useHAConnection hook created
- [ ] useEntity hook created
- [ ] useServiceCall hook created
- [ ] Entity mapper service created
- [ ] Config file imported and used
- [ ] Connection status indicator
- [ ] Retry logic for failed connections
- [ ] Unit tests for HA services
- [ ] README documentation

**Phase Gate:**
Can read entities, call services, UI renders properly.

---

## Week 3-4 Goals (Phase 2A: Calendar)

**Goal:** Working calendar view with navigation

**Deliverables:**
- [ ] Calendar component structure
- [ ] Week view grid layout
- [ ] Event rendering
- [ ] Multi-calendar support
- [ ] Color coding per calendar
- [ ] Navigation (prev/next/today)
- [ ] Calendar visibility toggles
- [ ] Real-time event updates
- [ ] Responsive design (mobile to tablet)
- [ ] Touch-optimized interactions

**Phase Gate:**
Family can view all calendars, navigate weeks, see events in real-time.

---

## Development Environment Checklist

**Before starting development:**
- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Git configured
- [ ] Code editor set up (VS Code recommended)
- [ ] Browser dev tools familiar
- [ ] HA access token created
- [ ] HA calendars authenticated
- [ ] Project structure understood
- [ ] Discovery docs reviewed
- [ ] MVP scope agreed upon

---

## Common Issues & Solutions

### Issue: Can't connect to HA WebSocket
**Solution:**
- Check HA URL is correct (http://192.168.1.2:8123)
- Verify access token is valid
- Check network connectivity
- Try REST API first (simpler debugging)
- Check browser console for CORS errors

### Issue: Calendars show "unavailable"
**Solution:**
- Re-authenticate Google Calendar integration
- Check OAuth consent screen settings
- Verify calendar sharing permissions
- Test with `calendar.basildon_council` (should work)

### Issue: Vite build fails
**Solution:**
- Check Node.js version (18+ required)
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check for syntax errors in config files

### Issue: WebSocket disconnects frequently
**Solution:**
- Implement exponential backoff retry
- Check HA server load
- Verify network stability
- Consider increasing ping interval

---

## Resources

### Documentation
- **HA WebSocket API:** https://developers.home-assistant.io/docs/api/websocket
- **HA REST API:** https://developers.home-assistant.io/docs/api/rest
- **React Docs:** https://react.dev
- **Tailwind CSS:** https://tailwindcss.com
- **Zustand:** https://zustand-demo.pmnd.rs
- **date-fns:** https://date-fns.org

### Example Projects
- **ha-dashboard:** https://github.com/matt8707/hass-config
- **home-panel:** https://github.com/timmo001/home-panel
- **dwains-dashboard:** https://github.com/dwainscheeren/dwains-lovelace-dashboard

### Community
- **Home Assistant Community:** https://community.home-assistant.io
- **Reddit:** r/homeassistant
- **Discord:** Home Assistant Discord server

---

## Decision Log

**Decisions Made:**
1. ✅ React + Vite (not CRA)
2. ✅ Tailwind CSS (not Bootstrap/MUI)
3. ✅ Zustand for state (not Redux)
4. ✅ WebSocket primary, REST fallback
5. ✅ Dark theme first
6. ✅ Mobile-first responsive
7. ✅ Calendar is Phase 2A (highest priority)

**Decisions Pending:**
- [ ] TypeScript or JavaScript?
- [ ] Single-page or multi-page?
- [ ] Testing framework (Vitest recommended)
- [ ] Deployment strategy (Docker? Static host?)
- [ ] CI/CD pipeline

---

## Questions for Clarification

**Technical:**
1. What's the Kitchen Calendar tablet model/OS version?
2. What's the current dashboard's screen resolution?
3. Are there any HA custom components we need to be aware of?
4. What's the network setup? (WiFi? Wired?)

**Functional:**
1. How many users will use this dashboard simultaneously?
2. Are there any features you use rarely that we could deprioritize?
3. What's the most important feature to get right?
4. Any color preferences beyond "match existing"?

**Operational:**
1. Who will maintain this dashboard long-term?
2. What's your HA backup strategy?
3. How often do you update HA?
4. Any planned HA changes (new devices, integrations)?

---

## Ready to Start?

**Quick Start Command:**
```bash
# Initialize project
npm create vite@latest . -- --template react
npm install
npm install zustand date-fns lucide-react @react-oauth/google
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Create .env file
echo "VITE_HA_URL=http://192.168.1.2:8123" > .env
echo "VITE_HA_TOKEN=your_ha_token_here" >> .env
echo "VITE_GOOGLE_CLIENT_ID=your_google_client_id_here" >> .env
echo ".env" >> .gitignore

# Start development
npm run dev
```

**Then:**
1. Test Google OAuth (authenticate with Google)
2. Fetch calendar list from Google Calendar API
3. Test HA WebSocket connection
4. Read one entity state
5. Call one service
6. Render entity state in UI
7. Celebrate! 🎉

---

## Success Metrics (First Week)

By end of Week 1, you should:
- ✅ Have a running React app
- ✅ Google OAuth authentication working
- ✅ Can fetch calendar list from Google Calendar API
- ✅ Successfully connect to HA WebSocket
- ✅ Read entity states in real-time
- ✅ Call HA services
- ✅ See live updates in the UI
- ✅ Have basic error handling
- ✅ Have a dark theme UI

**If you achieve this, you're on track for MVP in 7 weeks.**

---

## Get Help

**Stuck? Need help?**
- Ask in Home Assistant Community forums
- Check the discovery docs again
- Review the MVP spec
- Test with simple entities first (lights, switches)
- Use browser dev tools extensively
- Console.log everything during development

**Good luck! 🚀**
