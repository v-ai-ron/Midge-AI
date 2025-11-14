# vAIron Chat - Frontend

Un'interfaccia chat moderna e professionale per l'assistente AI vAIron con design gradiente viola-blu e animazioni fluide.

## Caratteristiche

### 🎨 Design Moderno
- Gradiente viola-blu professionale
- Animazioni fluide e moderne
- Interfaccia glassmorphism
- Design responsive per tutti i dispositivi

### 🤖 Funzionalità Chat
- Chat in tempo reale con l'API vAIron
- Gestione automatica delle sessioni
- Indicatore di digitazione
- Cronologia messaggi persistente
- Visualizzazione strumenti MCP utilizzati

### ⚙️ Funzionalità Avanzate
- Temi multipli (Predefinito, Scuro, Chiaro)
- Controllo animazioni
- Salvataggio automatico conversazioni
- Indicatore stato server
- Contatore caratteri
- Auto-resize textarea

### 🔧 Integrazione API
- Endpoint: `http://95.232.133.112:8002/chat`
- Gestione sessioni automatica
- Supporto per tutti gli strumenti MCP
- Gestione errori robusta
- Controllo stato server

## Come Usare

1. Apri `index.html` in un browser web moderno
2. L'applicazione si connetterà automaticamente al server vAIron
3. Inizia a chattare digitando un messaggio
4. Le conversazioni vengono salvate automaticamente

## Struttura File

```
FRONT END VAIRON/
├── index.html          # Struttura HTML principale
├── styles.css          # Stili CSS con tema gradiente
├── script.js           # Logica JavaScript e integrazione API
├── sw.js              # Service Worker per funzionalità offline
└── README.md          # Questo file
```

## Tecnologie Utilizzate

- **HTML5** - Struttura semantica
- **CSS3** - Animazioni e gradiente moderni
- **JavaScript ES6+** - Logica applicazione
- **Fetch API** - Comunicazione con server
- **Service Worker** - Funzionalità offline
- **Local Storage** - Persistenza dati

## Configurazione Server

Il frontend è configurato per connettersi a:
- **URL Base**: `http://95.232.133.112:8002`
- **Endpoint Chat**: `POST /chat`
- **Health Check**: `GET /health`

## Funzionalità Implementate

### Gestione Messaggi
- ✅ Invio messaggi al bot
- ✅ Ricezione risposte
- ✅ Visualizzazione timestamp
- ✅ Indicatore strumenti utilizzati
- ✅ Gestione errori

### Gestione Sessioni
- ✅ Creazione automatica sessioni
- ✅ Continuazione conversazioni
- ✅ Visualizzazione ID sessione
- ✅ Persistenza locale

### Interfaccia Utente
- ✅ Design responsive
- ✅ Animazioni fluide
- ✅ Temi multipli
- ✅ Pannello impostazioni
- ✅ Indicatori stato

## Browser Supportati

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Note Tecniche

- L'applicazione utilizza CORS per le chiamate API
- Le sessioni persistono fino al riavvio del server
- I dati locali vengono salvati nel localStorage del browser
- Il Service Worker fornisce funzionalità offline di base
