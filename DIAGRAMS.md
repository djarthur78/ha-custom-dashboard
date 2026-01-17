# Architecture Diagrams

Professional architecture diagrams for the HA Custom Dashboard project.

**Note:** These diagrams are written in Mermaid and render automatically on GitHub, VS Code (with Mermaid extension), and many markdown viewers.

---

## System Architecture Overview

```mermaid
graph TB
    subgraph "iPad Client (192.168.1.6:5173)"
        Browser[Safari Browser]
        React[React 19 App<br/>Vite Dev Server]

        subgraph "React Components"
            App[App.jsx]
            ConnStatus[ConnectionStatus.jsx]
            TestEntity[TestEntity.jsx]
            Spinner[LoadingSpinner.jsx]
        end

        subgraph "React Hooks"
            useConn[useHAConnection]
            useEnt[useEntity]
            useSvc[useServiceCall]
        end

        subgraph "Services (Singleton)"
            WSService[ha-websocket.js<br/>WebSocket Manager]
            RESTService[ha-rest.js<br/>REST Client]
        end
    end

    subgraph "Network Layer"
        WSL2[WSL2 Ubuntu<br/>172.27.69.40:5173]
        Windows[Windows Host<br/>192.168.1.6]
        PortFwd[Port Forwarding<br/>+ Firewall]
    end

    subgraph "Home Assistant (192.168.1.2:8123)"
        HACore[HA Core]
        WSEndpoint[WebSocket API<br/>/api/websocket]
        RESTEndpoint[REST API<br/>/api]

        subgraph "HA Entities"
            Lights[Lights]
            Switches[Switches]
            Sensors[Sensors]
            Calendars[Calendars]
            Cameras[Cameras]
        end
    end

    Browser --> React
    React --> App
    App --> ConnStatus
    App --> TestEntity
    TestEntity --> Spinner

    TestEntity --> useEnt
    TestEntity --> useSvc
    App --> useConn

    useConn --> WSService
    useEnt --> WSService
    useSvc --> WSService

    WSService -->|WebSocket<br/>Real-time| WSEndpoint
    RESTService -.->|HTTP<br/>One-time queries| RESTEndpoint

    WSEndpoint --> HACore
    RESTEndpoint --> HACore
    HACore --> Lights
    HACore --> Switches
    HACore --> Sensors
    HACore --> Calendars
    HACore --> Cameras

    Windows --> PortFwd
    PortFwd --> WSL2
    WSL2 --> React

    style React fill:#61dafb,stroke:#333,stroke-width:3px
    style WSService fill:#ff6b6b,stroke:#333,stroke-width:3px
    style HACore fill:#41bdf5,stroke:#333,stroke-width:3px
    style PortFwd fill:#ffd93d,stroke:#333,stroke-width:2px
```

---

## WebSocket Connection Flow

```mermaid
sequenceDiagram
    participant iPad as iPad Browser
    participant App as React App
    participant Hook as useHAConnection
    participant WS as ha-websocket.js
    participant HA as Home Assistant

    iPad->>App: Load http://192.168.1.6:5173/
    App->>Hook: Mount component
    Hook->>WS: connect()

    Note over WS: Check if already connected

    WS->>HA: new WebSocket(ws://192.168.1.2:8123/api/websocket)
    HA-->>WS: Connection opened
    HA->>WS: {type: "auth_required"}

    WS->>HA: {type: "auth", access_token: "..."}
    HA->>WS: {type: "auth_ok"}

    Note over WS: isAuthenticated = true

    WS->>HA: {type: "subscribe_events", event_type: "state_changed"}
    HA->>WS: {type: "result", success: true}

    WS->>Hook: Status: "connected"
    Hook->>App: isConnected = true
    App->>iPad: Show "Connected" (green)

    Note over App,HA: Ready for entity queries
```

---

## Entity State Update Flow

```mermaid
sequenceDiagram
    participant User as User (iPad)
    participant Comp as TestEntity Component
    participant Hook as useEntity Hook
    participant WS as ha-websocket.js
    participant HA as Home Assistant

    Note over Comp: Component mounts
    Comp->>Hook: useEntity("light.reading_light")

    Hook->>WS: getState("light.reading_light")
    WS->>HA: {type: "get_states", id: 1}

    HA->>WS: {type: "result", success: true, result: [...]}
    WS->>Hook: {entity_id: "light.reading_light", state: "off", ...}

    Hook->>Comp: {state: "off", attributes: {...}, loading: false}
    Comp->>User: Display: "Office Reading Lamp - OFF"

    Note over Hook,WS: Subscribe to updates
    Hook->>WS: subscribeToEntity("light.reading_light", callback)

    Note over HA: Someone toggles light in HA
    HA->>WS: {type: "event", event: {event_type: "state_changed", ...}}
    WS->>Hook: callback(newState)
    Hook->>Comp: Re-render with new state
    Comp->>User: Display: "Office Reading Lamp - ON"
```

---

## Service Call Flow (Toggle Light)

```mermaid
sequenceDiagram
    participant User as User (iPad)
    participant Comp as TestEntity Component
    participant Hook as useServiceCall
    participant WS as ha-websocket.js
    participant HA as Home Assistant

    User->>Comp: Click "Turn On" button
    Comp->>Hook: toggle("light.reading_light")

    Hook->>WS: callService("light", "turn_on", {entity_id: "..."})
    WS->>HA: {type: "call_service", domain: "light", service: "turn_on", ...}

    Note over WS: 10-second timeout active

    HA->>WS: {type: "result", success: true}
    WS->>Hook: Promise resolved
    Hook->>Comp: Service call complete

    Note over HA: HA changes light state
    HA->>WS: {type: "event", event_type: "state_changed", ...}
    WS->>Comp: State update (via useEntity subscription)
    Comp->>User: Display: "Office Reading Lamp - ON"
```

---

## React Component Hierarchy

```mermaid
graph TD
    ErrorBoundary[ErrorBoundary<br/>Catches React errors]
    App[App.jsx<br/>Root component]
    Header[Header Section]
    Main[Main Content]
    Footer[Footer Section]

    ConnStatus[ConnectionStatus.jsx<br/>Shows connection state]
    LoadingMsg[LoadingSpinner<br/>During connection]
    TestEntity[TestEntity.jsx<br/>Demo entity card]
    NotConnected[Not Connected Message]

    ErrorBoundary --> App
    App --> Header
    App --> Main
    App --> Footer

    Header --> ConnStatus

    Main --> LoadingMsg
    Main --> TestEntity
    Main --> NotConnected

    TestEntity -.->|uses| useEntity[useEntity hook]
    TestEntity -.->|uses| useServiceCall[useServiceCall hook]
    App -.->|uses| useHAConnection[useHAConnection hook]

    useEntity -.->|calls| WSService[ha-websocket.js]
    useServiceCall -.->|calls| WSService
    useHAConnection -.->|calls| WSService

    style ErrorBoundary fill:#ff6b6b,stroke:#333,stroke-width:2px
    style App fill:#61dafb,stroke:#333,stroke-width:3px
    style WSService fill:#ffd93d,stroke:#333,stroke-width:3px
```

---

## Hook State Management

```mermaid
stateDiagram-v2
    [*] --> Disconnected: App starts

    Disconnected --> Connecting: connect() called
    Connecting --> Connected: auth_ok received
    Connecting --> AuthFailed: auth_invalid received
    Connecting --> Error: Connection error

    Connected --> Disconnected: Connection lost
    Error --> Reconnecting: Auto-reconnect
    Reconnecting --> Connecting: Retry attempt
    Reconnecting --> MaxRetries: 10 attempts failed

    Connected --> [*]: disconnect() called
    MaxRetries --> [*]: Give up

    note right of Connected
        isConnected = true
        Components can fetch entities
    end note

    note right of Reconnecting
        Exponential backoff
        1s, 2s, 4s, 8s, 16s, 30s...
    end note
```

---

## Data Flow: WebSocket Singleton Pattern

```mermaid
graph LR
    subgraph "Multiple Components"
        Comp1[Component A<br/>useEntity]
        Comp2[Component B<br/>useEntity]
        Comp3[Component C<br/>useServiceCall]
    end

    subgraph "Singleton Service"
        WS[ha-websocket.js<br/>Single Instance]
        Listeners[Message Listeners<br/>Map<id, callback>]
        Subscribers[State Subscribers<br/>Map<entity_id, Set<callback>>]
    end

    subgraph "Home Assistant"
        HA[WebSocket Connection<br/>ws://192.168.1.2:8123]
    end

    Comp1 -->|subscribe| Subscribers
    Comp2 -->|subscribe| Subscribers
    Comp3 -->|call service| Listeners

    Subscribers --> WS
    Listeners --> WS

    WS <-->|Single connection| HA

    HA -->|state_changed event| WS
    WS -->|notify| Subscribers
    Subscribers -->|update| Comp1
    Subscribers -->|update| Comp2

    style WS fill:#ff6b6b,stroke:#333,stroke-width:3px
    style HA fill:#41bdf5,stroke:#333,stroke-width:2px
```

---

## Network Topology

```mermaid
graph TB
    subgraph "LAN (192.168.1.0/24)"
        iPad[iPad<br/>192.168.1.x<br/>Safari]
        PC[Windows PC<br/>192.168.1.6]
        HAServer[HA Server<br/>192.168.1.2:8123]
        Router[Router<br/>192.168.1.1]
    end

    subgraph "Windows (192.168.1.6)"
        WSL2[WSL2 Ubuntu<br/>172.27.69.40]
        Firewall[Windows Firewall<br/>Allow TCP 5173]
        PortProxy[Port Forwarding<br/>0.0.0.0:5173 → 172.27.69.40:5173]
    end

    subgraph "WSL2 (172.27.69.40)"
        Vite[Vite Dev Server<br/>:5173]
        Node[Node.js 22+]
    end

    iPad -->|HTTP| Router
    Router -->|192.168.1.6:5173| PC
    PC --> Firewall
    Firewall --> PortProxy
    PortProxy -->|172.27.69.40:5173| WSL2
    WSL2 --> Vite
    Vite --> Node

    Vite -->|WebSocket<br/>ws://192.168.1.2:8123| Router
    Router --> HAServer

    style PC fill:#ffd93d,stroke:#333,stroke-width:2px
    style WSL2 fill:#61dafb,stroke:#333,stroke-width:2px
    style HAServer fill:#41bdf5,stroke:#333,stroke-width:2px
```

---

## Critical Bug #1: Stale State Issue (FIXED)

**Before Fix:**

```mermaid
sequenceDiagram
    participant App as App Component
    participant Entity as TestEntity Component
    participant Hook1 as useHAConnection (Instance 1)
    participant Hook2 as useHAConnection (Instance 2)
    participant WS as ha-websocket.js (Singleton)
    participant HA as Home Assistant

    Note over WS: Initial state: disconnected

    App->>Hook1: Mount
    Hook1->>Hook1: useState('disconnected')
    Hook1->>WS: connect()
    WS->>HA: Connect
    HA-->>WS: auth_ok
    WS->>Hook1: notify('connected')
    Hook1->>Hook1: setState('connected')
    Hook1->>App: isConnected = true

    Note over App: Renders TestEntity (because connected)

    App->>Entity: Render
    Entity->>Hook2: Mount
    Hook2->>Hook2: useState('disconnected')

    Note over Hook2,WS: BUG! Hook2 doesn't know WS is already connected!

    Hook2->>Entity: isConnected = false
    Entity->>Entity: Skip entity fetch (not connected)

    Note over Entity: STUCK IN "Loading..." FOREVER
```

**After Fix:**

```mermaid
sequenceDiagram
    participant App as App Component
    participant Entity as TestEntity Component
    participant Hook1 as useHAConnection (Instance 1)
    participant Hook2 as useHAConnection (Instance 2)
    participant WS as ha-websocket.js (Singleton)
    participant HA as Home Assistant

    Note over WS: Initial state: disconnected

    App->>Hook1: Mount
    Hook1->>WS: getStatus()
    WS-->>Hook1: 'disconnected'
    Hook1->>Hook1: useState('disconnected')
    Hook1->>WS: connect()
    WS->>HA: Connect
    HA-->>WS: auth_ok
    WS->>Hook1: notify('connected')
    Hook1->>Hook1: setState('connected')
    Hook1->>App: isConnected = true

    Note over App: Renders TestEntity (because connected)

    App->>Entity: Render
    Entity->>Hook2: Mount
    Hook2->>WS: getStatus()
    WS-->>Hook2: 'connected' ✅
    Hook2->>Hook2: useState('connected')
    Hook2->>Entity: isConnected = true ✅
    Entity->>Entity: Fetch entity state ✅

    Note over Entity: WORKS! Entity loads correctly
```

---

## File Dependencies

```mermaid
graph TD
    subgraph "Entry Point"
        HTML[index.html]
        Main[main.jsx]
    end

    subgraph "Root Component"
        App[App.jsx]
        CSS[index.css]
    end

    subgraph "Components"
        ConnStatus[ConnectionStatus.jsx]
        TestEntity[TestEntity.jsx]
        Spinner[LoadingSpinner.jsx]
        ErrorBound[ErrorBoundary.jsx]
    end

    subgraph "Hooks"
        useConn[useHAConnection.js]
        useEntity[useEntity.js]
        useSvc[useServiceCall.js]
    end

    subgraph "Services"
        WSService[ha-websocket.js]
        RESTService[ha-rest.js]
    end

    subgraph "Config"
        ENV[.env]
        Vite[vite.config.js]
        PostCSS[postcss.config.js]
    end

    HTML --> Main
    Main --> App
    Main --> CSS

    App --> ConnStatus
    App --> TestEntity
    App --> ErrorBound
    TestEntity --> Spinner

    ConnStatus --> useConn
    TestEntity --> useEntity
    TestEntity --> useSvc
    App --> useConn

    useConn --> WSService
    useEntity --> WSService
    useSvc --> WSService

    WSService --> ENV

    App -.->|build config| Vite
    CSS -.->|process| PostCSS

    style Main fill:#61dafb,stroke:#333,stroke-width:2px
    style WSService fill:#ff6b6b,stroke:#333,stroke-width:3px
    style ENV fill:#ffd93d,stroke:#333,stroke-width:2px
```

---

## Technology Stack Layers

```mermaid
graph TB
    subgraph "Presentation Layer"
        Browser[Safari Browser<br/>iPad]
        UI[React 19 Components]
        Styles[Tailwind CSS v4]
        Icons[Lucide React]
    end

    subgraph "Application Layer"
        Hooks[React Hooks<br/>State Management]
        Router[React Router<br/>Not yet implemented]
        Forms[Forms & Validation<br/>Not yet implemented]
    end

    subgraph "Integration Layer"
        WSClient[WebSocket Client<br/>ha-websocket.js]
        RESTClient[REST Client<br/>ha-rest.js]
        EventBus[Event Subscriptions<br/>Map-based]
    end

    subgraph "External Services"
        HA[Home Assistant<br/>192.168.1.2:8123]
        Calendars[Google Calendars<br/>via HA entities]
        Cameras[UniFi Cameras<br/>via HA entities]
    end

    subgraph "Development Tools"
        Vite[Vite 7<br/>Build & Dev Server]
        PostCSS[PostCSS<br/>Tailwind Processing]
        ESLint[ESLint<br/>Code Quality]
    end

    Browser --> UI
    UI --> Styles
    UI --> Icons
    UI --> Hooks

    Hooks --> WSClient
    Hooks --> RESTClient
    WSClient --> EventBus

    WSClient --> HA
    RESTClient --> HA
    HA --> Calendars
    HA --> Cameras

    UI -.->|build| Vite
    Styles -.->|process| PostCSS
    UI -.->|lint| ESLint

    style UI fill:#61dafb,stroke:#333,stroke-width:3px
    style WSClient fill:#ff6b6b,stroke:#333,stroke-width:3px
    style HA fill:#41bdf5,stroke:#333,stroke-width:3px
    style Vite fill:#646cff,stroke:#333,stroke-width:2px
```

---

**Last Updated:** 2026-01-17 (Phase 1 Complete)

**How to View:**
- **GitHub:** Diagrams render automatically
- **VS Code:** Install "Markdown Preview Mermaid Support" extension
- **Online:** Copy/paste into https://mermaid.live/

**How to Edit:**
- Edit the Mermaid code blocks directly
- Preview changes with Mermaid Live Editor
- Commit and push to see on GitHub
