# ============================================================
#   YASO SMC PRO BOT — Configuration File
#   Developed by: YASO Media Studio
#   Version: 1.0.0
# ============================================================

# ─── MT5 ACCOUNT SETTINGS ───────────────────────────────────
MT5_LOGIN    = 108949850          # Apna MT5 account number
MT5_PASSWORD = "YOUR_PASSWORD"    # MT5 password yahan daalo
MT5_SERVER   = "MetaQuotes-Demo"  # Broker server name

# ─── TELEGRAM SETTINGS ──────────────────────────────────────
TELEGRAM_TOKEN   = "YOUR_BOT_TOKEN"   # BotFather se milega
TELEGRAM_CHAT_ID = "YOUR_CHAT_ID"     # @userinfobot se milega

# ─── TRADING SETTINGS ───────────────────────────────────────
SYMBOL     = "XAUUSD"   # Gold — ya koi bhi symbol
TIMEFRAME  = "M5"       # M5, M15, M30, H1, H4, D1
LOT_SIZE   = 0.01       # Minimum safe lot size

# ─── RISK MANAGEMENT ────────────────────────────────────────
RISK_PERCENT      = 1.0   # Har trade mein account ka 1% risk
SL_PIPS           = 20    # Stop Loss (pips)
TP_RATIO          = 2.0   # Take Profit = SL x 2 (RR 1:2)
MAX_OPEN_TRADES   = 2     # Ek waqt mein max kitne trades

# ─── SMC SETTINGS ───────────────────────────────────────────
OB_LOOKBACK       = 10   # Order Block dhundne ke liye candles
BOS_LOOKBACK      = 20   # Break of Structure confirm karne ke liye
LIQUIDITY_LOOKBACK= 15   # Liquidity zones dhundne ke liye

# ─── INDICATOR SETTINGS ─────────────────────────────────────
RSI_PERIOD        = 14
RSI_OVERBOUGHT    = 70
RSI_OVERSOLD      = 30
MACD_FAST         = 12
MACD_SLOW         = 26
MACD_SIGNAL       = 9

# ─── BOT LOOP ───────────────────────────────────────────────
CHECK_INTERVAL_SEC = 60  # Har 60 second baad market check karo

# ─── MULTI TRADE SETTINGS ────────────────────────────────────
AUTO_TRADE_COUNT  = 1     # Ek signal pe kitne orders lagao
TRADE_GAP_SECONDS = 5     # Orders ke beech gap (seconds)
