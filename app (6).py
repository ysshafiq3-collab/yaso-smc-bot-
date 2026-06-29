# ============================================================
#   YASO SMC PRO BOT — Cyber Matrix Desktop App v1.1
#   Execute Trade Button Added
# ============================================================

import tkinter as tk
from tkinter import ttk, scrolledtext
import threading
import time
from datetime import datetime

BG0   = "#000000"
BG1   = "#020802"
BG2   = "#030d03"
BG3   = "#061006"
BG4   = "#0a160a"
G1    = "#00ff41"
G2    = "#00cc33"
G3    = "#008f22"
G4    = "#004d12"
CYAN  = "#00ffcc"
RED   = "#ff0033"
AMBER = "#ffaa00"
TEXT  = "#b0ffb8"
TEXT2 = "#6aff7a"
TEXT3 = "#2d7a36"
BORD  = "#0a2a0a"
BORD2 = "#051405"


def now_ts():
    return datetime.now().strftime("%H:%M:%S")


class YasoApp:
    def __init__(self, root):
        self.root = root
        self.root.title("YASO SMC PRO BOT  v1.1  |  YASO Media Studio")
        self.root.geometry("1200x800")
        self.root.configure(bg=BG0)
        self.root.resizable(True, True)

        self.analyzing       = False
        self.bot_running     = False
        self.sig_count       = 0
        self.trade_count     = 0
        self.last_signal_data= None

        self._styles()
        self._build()

    def _styles(self):
        s = ttk.Style()
        s.theme_use("clam")
        s.configure("Treeview",
                    background=BG2, foreground=TEXT2,
                    rowheight=24, fieldbackground=BG2,
                    font=("Consolas", 9))
        s.configure("Treeview.Heading",
                    background=BG1, foreground=TEXT3,
                    font=("Consolas", 8, "bold"), relief="flat")
        s.map("Treeview", background=[("selected", BG4)])

    def _build(self):
        self._topbar()
        body = tk.Frame(self.root, bg=BG0)
        body.pack(fill="both", expand=True)
        self._sidebar(body)
        self._content(body)

    def _topbar(self):
        bar = tk.Frame(self.root, bg=BG1, height=52)
        bar.pack(fill="x")
        bar.pack_propagate(False)
        tk.Frame(bar, bg=G1, width=2).pack(side="left", fill="y")
        tk.Label(bar, text="◈  YASO SMC PRO",
                 font=("Consolas", 16, "bold"),
                 bg=BG1, fg=G1).pack(side="left", padx=(14,4), pady=14)
        tk.Label(bar, text="SMART MONEY CONCEPTS  |  XAUUSD  |  M5",
                 font=("Consolas", 9), bg=BG1, fg=TEXT3).pack(side="left", padx=2)
        self.status_lbl = tk.Label(bar, text="● MT5 OFFLINE",
                                    font=("Consolas", 10, "bold"),
                                    bg=BG1, fg=RED)
        self.status_lbl.pack(side="right", padx=18)
        self.clock_lbl = tk.Label(bar, text="--:--:--",
                                   font=("Consolas", 12), bg=BG1, fg=G2)
        self.clock_lbl.pack(side="right", padx=14)
        tk.Frame(self.root, bg=G1, height=1).pack(fill="x")
        self._tick()

    def _tick(self):
        self.clock_lbl.config(text=datetime.now().strftime("%H:%M:%S"))
        self.root.after(1000, self._tick)

    def _sidebar(self, parent):
        side = tk.Frame(parent, bg=BG1, width=265)
        side.pack(side="left", fill="y")
        side.pack_propagate(False)
        tk.Frame(side, bg=BORD, height=1).pack(fill="x")

        inner = tk.Frame(side, bg=BG1)
        inner.pack(fill="both", expand=True, padx=10, pady=10)

        # GENERATE SIGNAL
        self.gen_btn = tk.Button(
            inner, text="⚡  GENERATE SIGNAL",
            font=("Consolas", 12, "bold"),
            bg=BG0, fg=G1, relief="flat", cursor="hand2",
            activebackground=BG3, activeforeground=G1,
            bd=1, highlightbackground=G1, highlightthickness=1,
            command=self.generate_signal, pady=11)
        self.gen_btn.pack(fill="x", pady=(0, 8))

        # Signal output
        self._sec_label(inner, "SIGNAL OUTPUT")
        sig_card = tk.Frame(inner, bg=BG2,
                             highlightbackground=G3, highlightthickness=1)
        sig_card.pack(fill="x", pady=(0, 6))
        self.sig_val = tk.Label(sig_card, text="---",
                                 font=("Consolas", 30, "bold"),
                                 bg=BG2, fg=TEXT3)
        self.sig_val.pack(pady=(8,2))
        tk.Label(sig_card, text="XAUUSD  |  M5",
                 font=("Consolas", 9), bg=BG2, fg=TEXT3).pack(pady=(0,8))

        # Entry/SL/TP
        self._sec_label(inner, "ENTRY / SL / TP")
        f1 = self._card(inner)
        self.v_entry = self._kv(f1, "Entry", CYAN)
        self.v_sl    = self._kv(f1, "Stop loss", RED)
        self.v_tp    = self._kv(f1, "Take profit", G1)
        self.v_lot   = self._kv(f1, "Lot size", TEXT)

        # Win Probability
        self._sec_label(inner, "WIN PROBABILITY")
        wp = self._card(inner)
        self.prob_pct = tk.Label(wp, text="---%",
                                  font=("Consolas", 20, "bold"),
                                  bg=BG2, fg=G1)
        self.prob_pct.pack()
        self.prob_track = tk.Frame(wp, bg=BG4, height=4)
        self.prob_track.pack(fill="x", pady=(5,3))
        self.prob_fill = tk.Frame(self.prob_track, bg=G1, height=4)
        self.prob_fill.place(x=0, y=0, relheight=1, width=0)
        row = tk.Frame(wp, bg=BG2)
        row.pack(fill="x")
        tk.Label(row, text="LOW",  font=("Consolas",8), bg=BG2, fg=TEXT3).pack(side="left")
        tk.Label(row, text="HIGH", font=("Consolas",8), bg=BG2, fg=TEXT3).pack(side="right")

        # Analysis
        self._sec_label(inner, "ANALYSIS")
        f2 = self._card(inner)
        self.v_rsi  = self._kv(f2, "RSI (14)", CYAN)
        self.v_macd = self._kv(f2, "MACD hist", CYAN)
        self.v_bos  = self._kv(f2, "BOS", G1)
        self.v_ob   = self._kv(f2, "Order block", G1)

        # Account
        self._sec_label(inner, "ACCOUNT")
        f3 = self._card(inner)
        self.v_bal = self._kv(f3, "Balance", TEXT)
        self.v_eq  = self._kv(f3, "Equity", TEXT)
        self.v_pnl = self._kv(f3, "Open P&L", G1)

        # ── EXECUTE TRADE BUTTON ─────────────────────────────
        tk.Frame(inner, bg=G4, height=1).pack(fill="x", pady=(8,0))
        self._sec_label(inner, "TRADE EXECUTION")

        self.exec_btn = tk.Button(
            inner, text="🚀  EXECUTE TRADE NOW",
            font=("Consolas", 11, "bold"),
            bg=BG0, fg=CYAN, relief="flat", cursor="hand2",
            activebackground=BG3, activeforeground=CYAN,
            highlightbackground=CYAN, highlightthickness=1,
            command=self.execute_trade, pady=11)
        self.exec_btn.pack(fill="x", pady=(0,4))

        self.exec_status = tk.Label(inner,
                                     text="⚠  Generate signal first",
                                     font=("Consolas", 9),
                                     bg=BG1, fg=TEXT3)
        self.exec_status.pack(anchor="w")

        # Auto trade toggle
        tk.Frame(inner, bg=BORD, height=1).pack(fill="x", pady=(8,0))
        self.auto_var = tk.BooleanVar(value=False)
        af = self._card(inner)
        tk.Checkbutton(af, text="  AUTO EXECUTE ON SIGNAL",
                       variable=self.auto_var,
                       font=("Consolas", 9), bg=BG2, fg=G2,
                       selectcolor=BG0, activebackground=BG2,
                       activeforeground=G1).pack(anchor="w", pady=2)

        # ── TRADE COUNT SELECTOR ─────────────────────────────
        self._sec_label(inner, "NUMBER OF TRADES")
        tc = self._card(inner)
        tc_row = tk.Frame(tc, bg=BG2)
        tc_row.pack(fill="x", pady=4)
        tk.Label(tc_row, text="Orders per signal:",
                 font=("Consolas", 9), bg=BG2, fg=TEXT3).pack(side="left")
        self.trade_count_var = tk.IntVar(value=1)
        spin = tk.Spinbox(tc_row,
                          from_=1, to=10,
                          textvariable=self.trade_count_var,
                          font=("Consolas", 11, "bold"),
                          bg=BG0, fg=G1,
                          buttonbackground=BG3,
                          highlightbackground=G4,
                          highlightthickness=1,
                          width=4, justify="center")
        spin.pack(side="right", padx=4)

        tk.Label(tc, text="Bot will place this many orders on each signal",
                 font=("Consolas", 8), bg=BG2, fg=TEXT3).pack(anchor="w", pady=(0,4))

        # Auto scan buttons
        self.scan_btn = tk.Button(inner, text="▶  START AUTO SCAN",
                                   font=("Consolas", 9, "bold"),
                                   bg=BG0, fg=G3, relief="flat",
                                   cursor="hand2",
                                   highlightbackground=G4,
                                   highlightthickness=1,
                                   command=self.start_scan, pady=7)
        self.scan_btn.pack(fill="x", pady=(8,3))

        self.stop_btn = tk.Button(inner, text="■  STOP",
                                   font=("Consolas", 9, "bold"),
                                   bg=BG0, fg=RED, relief="flat",
                                   cursor="hand2",
                                   highlightbackground=BORD,
                                   highlightthickness=1,
                                   command=self.stop_scan,
                                   state="disabled", pady=7)
        self.stop_btn.pack(fill="x")

        tk.Frame(parent, bg=BORD, width=1).pack(side="left", fill="y")

    def _sec_label(self, parent, text):
        tk.Label(parent, text=text,
                 font=("Consolas", 8, "bold"),
                 bg=BG1, fg=TEXT3).pack(anchor="w", pady=(5,2))

    def _card(self, parent):
        outer = tk.Frame(parent, bg=BG2,
                         highlightbackground=BORD, highlightthickness=1)
        outer.pack(fill="x", pady=(0,6))
        inner = tk.Frame(outer, bg=BG2)
        inner.pack(fill="x", padx=8, pady=4)
        return inner

    def _kv(self, parent, label, val_color=TEXT):
        row = tk.Frame(parent, bg=BG2)
        row.pack(fill="x", pady=2)
        tk.Label(row, text=label,
                 font=("Consolas", 9), bg=BG2, fg=TEXT3).pack(side="left")
        lbl = tk.Label(row, text="---",
                       font=("Consolas", 10, "bold"),
                       bg=BG2, fg=val_color)
        lbl.pack(side="right")
        return lbl

    def _content(self, parent):
        content = tk.Frame(parent, bg=BG0)
        content.pack(side="left", fill="both", expand=True)

        # Metrics
        metrics = tk.Frame(content, bg=BG1)
        metrics.pack(fill="x")
        tk.Frame(metrics, bg=BORD, height=1).pack(fill="x")
        mrow = tk.Frame(metrics, bg=BG1)
        mrow.pack(fill="x", padx=10, pady=8)
        self.m_sig    = self._metric(mrow, "SIGNALS TODAY", "0",    G1)
        self.m_trade  = self._metric(mrow, "TRADES PLACED", "0",    TEXT)
        self.m_win    = self._metric(mrow, "WIN RATE",      "---%", G1)
        self.m_spread = self._metric(mrow, "SPREAD",        "---",  CYAN)
        tk.Frame(metrics, bg=BORD, height=1).pack(fill="x")

        # Middle
        mid = tk.Frame(content, bg=BG0)
        mid.pack(fill="both", expand=True, padx=10, pady=8)

        # Chart
        chart_panel = tk.Frame(mid, bg=BG2,
                               highlightbackground=BORD, highlightthickness=1)
        chart_panel.pack(side="left", fill="both", expand=True, padx=(0,5))
        head = tk.Frame(chart_panel, bg=BG2)
        head.pack(fill="x", padx=10, pady=6)
        tk.Label(head, text="PRICE ACTION — XAUUSD M5",
                 font=("Consolas",8,"bold"), bg=BG2, fg=TEXT3).pack(side="left")
        self.live_price_lbl = tk.Label(head, text="---",
                                        font=("Consolas",10,"bold"),
                                        bg=BG2, fg=G1)
        self.live_price_lbl.pack(side="right")
        tk.Frame(chart_panel, bg=BORD, height=1).pack(fill="x")
        self.chart_canvas = tk.Canvas(chart_panel, bg=BG0,
                                       highlightthickness=0, height=200)
        self.chart_canvas.pack(fill="both", expand=True, padx=6, pady=6)
        self.chart_canvas.bind("<Configure>", lambda e: self._draw_chart())
        self.chart_prices = []

        # History
        hist_panel = tk.Frame(mid, bg=BG2,
                              highlightbackground=BORD, highlightthickness=1)
        hist_panel.pack(side="left", fill="both", expand=True)
        tk.Label(hist_panel, text="SIGNAL HISTORY",
                 font=("Consolas",8,"bold"), bg=BG2, fg=TEXT3).pack(
                     anchor="w", padx=10, pady=6)
        tk.Frame(hist_panel, bg=BORD, height=1).pack(fill="x")

        cols = ("TIME","DIR","ENTRY","SL","TP","WIN%","STATUS")
        self.tree = ttk.Treeview(hist_panel, columns=cols,
                                  show="headings", height=8)
        widths = [65,50,75,75,75,50,70]
        for col,w in zip(cols, widths):
            self.tree.heading(col, text=col)
            self.tree.column(col, width=w, anchor="center")
        self.tree.tag_configure("buy",  foreground=G1)
        self.tree.tag_configure("sell", foreground=RED)
        self.tree.pack(fill="both", expand=True, padx=4, pady=(0,4))

        # Log
        log_frame = tk.Frame(content, bg=BG1,
                             highlightbackground=BORD, highlightthickness=1)
        log_frame.pack(fill="x", padx=10, pady=(0,8))
        tk.Label(log_frame, text="SYSTEM LOG",
                 font=("Consolas",8,"bold"),
                 bg=BG1, fg=TEXT3).pack(anchor="w", padx=10, pady=(6,3))
        self.log_box = scrolledtext.ScrolledText(
            log_frame, font=("Consolas",9),
            bg=BG0, fg=G1, insertbackground=G1,
            relief="flat", state="disabled", height=6)
        self.log_box.pack(fill="x", padx=8, pady=(0,8))
        self.log("System ready. Press GENERATE SIGNAL.", "def")

    def _metric(self, parent, label, val, color):
        f = tk.Frame(parent, bg=BG2,
                     highlightbackground=BORD, highlightthickness=1)
        f.pack(side="left", expand=True, fill="x", padx=3)
        tk.Label(f, text=label,
                 font=("Consolas",8,"bold"),
                 bg=BG2, fg=TEXT3).pack(anchor="w", padx=10, pady=(7,2))
        lbl = tk.Label(f, text=val,
                       font=("Consolas",18,"bold"),
                       bg=BG2, fg=color)
        lbl.pack(anchor="w", padx=10, pady=(0,7))
        return lbl

    def _draw_chart(self):
        c = self.chart_canvas
        c.delete("all")
        w = c.winfo_width()
        h = c.winfo_height()
        if w < 10 or not self.chart_prices:
            return
        prices = self.chart_prices[-60:]
        mn, mx = min(prices), max(prices)
        rng = mx - mn if mx != mn else 1
        def px(i): return int(i/(len(prices)-1)*(w-20))+10 if len(prices)>1 else w//2
        def py(p): return int((mx-p)/rng*(h-20))+10
        for i in range(4):
            c.create_line(0, int(h*i/3), w, int(h*i/3), fill=BG3, width=1)
        pts = []
        for i, price in enumerate(prices):
            pts.extend([px(i), py(price)])
        if len(pts) >= 4:
            c.create_line(*pts, fill=G1, width=1, smooth=True)
        if prices:
            cx, cy = px(len(prices)-1), py(prices[-1])
            c.create_oval(cx-4, cy-4, cx+4, cy+4, fill=G1, outline=BG0)

    def log(self, msg, typ="def"):
        colors = {"ok": G1, "info": CYAN, "err": RED, "def": TEXT2}
        color  = colors.get(typ, TEXT2)
        full   = f"[{now_ts()}]  {msg}\n"
        self.log_box.config(state="normal")
        self.log_box.insert("end", full, now_ts())
        self.log_box.tag_config(now_ts(), foreground=color)
        self.log_box.see("end")
        self.log_box.config(state="disabled")

    # ── GENERATE SIGNAL ──────────────────────────────────────
    def generate_signal(self):
        if self.analyzing:
            return
        self.analyzing = True
        self.gen_btn.config(text="⏳  ANALYZING...",
                             state="disabled", fg=TEXT3)
        self.sig_val.config(text="...", fg=TEXT3)
        self.log(">> Market analysis initiated...", "info")
        threading.Thread(target=self._do_generate, daemon=True).start()

    def _do_generate(self):
        try:
            from trader       import connect_mt5, disconnect_mt5, get_candles, get_current_price, place_order, get_account_summary, calculate_lot_size
            from smc_analysis import get_smc_signal
            from indicators   import get_indicator_signal
            from discord_bot  import send_signal_alert, send_trade_result
            from config       import SYMBOL, TIMEFRAME, SL_PIPS, TP_RATIO

            self.log(">> Connecting to MT5...", "def")
            if not connect_mt5():
                self.log(">> ERROR: MT5 connection failed!", "err")
                self.root.after(0, self._reset_gen_btn)
                return

            self.root.after(0, lambda: self.status_lbl.config(
                text="● MT5 ONLINE", fg=G1))
            self.log(f">> Fetching {SYMBOL} {TIMEFRAME} data...", "ok")

            df = get_candles(SYMBOL, TIMEFRAME, count=200)
            if df is None or len(df) < 60:
                self.log(">> ERROR: Insufficient data!", "err")
                disconnect_mt5()
                self.root.after(0, self._reset_gen_btn)
                return

            self.log(">> SMC: scanning OB, BOS, CHoCH...", "info")
            smc = get_smc_signal(df)
            self.log(">> RSI + MACD confluence...", "info")
            ind = get_indicator_signal(df)

            price_info = get_current_price(SYMBOL)
            price      = price_info["bid"] if price_info else 0.0
            rsi        = ind.get("rsi", 0)
            macd_hist  = ind.get("macd_hist", 0)

            if smc["signal"] == ind["signal"] and smc["signal"] != "WAIT":
                signal   = smc["signal"]
                win_prob = 65.0
                if smc.get("bos"):   win_prob += 10
                if smc.get("choch"): win_prob += 8
                if smc.get("bullish_ob") or smc.get("bearish_ob"): win_prob += 7
                win_prob = min(win_prob, 92.0)
            else:
                signal   = smc["signal"] if smc["signal"] != "WAIT" else ind["signal"]
                win_prob = 55.0

            if signal == "BUY":
                sl = round(price - SL_PIPS, 5)
                tp = round(price + SL_PIPS * TP_RATIO, 5)
            elif signal == "SELL":
                sl = round(price + SL_PIPS, 5)
                tp = round(price - SL_PIPS * TP_RATIO, 5)
            else:
                sl = tp = 0.0

            acc = get_account_summary()
            bal = acc.get("balance", 0)
            eq  = acc.get("equity",  0)
            pnl = acc.get("profit",  0)
            lot = calculate_lot_size(bal)
            ob  = smc.get("bullish_ob") or smc.get("bearish_ob")

            # Save for execute button
            self.last_signal_data = {
                "signal": signal, "price": price,
                "sl": sl, "tp": tp, "lot": lot,
                "rsi": rsi, "macd_hist": macd_hist,
                "reason": smc.get("reason", []),
                "win_prob": win_prob
            }

            self.chart_prices.append(price)
            if len(self.chart_prices) > 100:
                self.chart_prices.pop(0)

            self.root.after(0, lambda: self._update_ui(
                signal, price, sl, tp, rsi, macd_hist,
                smc.get("bos"), ob, win_prob, bal, eq, pnl, lot))

            if signal in ("BUY", "SELL"):
                c = "ok" if signal == "BUY" else "err"
                self.log(f">> SIGNAL: {signal} @ {price} | PROB: {win_prob:.0f}%", c)
                send_signal_alert(signal, SYMBOL, price, sl, tp, lot,
                                  smc["reason"], rsi, macd_hist, win_prob)
                self.log(">> Discord alert sent!", "info")

                # Auto execute if enabled
                if self.auto_var.get():
                    num_trades = self.trade_count_var.get()
                    self.log(f">> Auto executing {num_trades} trade(s)...", "info")
                    for i in range(num_trades):
                        trade = place_order(signal)
                        if trade["success"]:
                            self.trade_count += 1
                            self.log(f">> ✅ Trade {i+1}/{num_trades}! Ticket:{trade['ticket']}", "ok")
                            send_trade_result(signal, SYMBOL, trade["ticket"],
                                              trade["price"], trade["sl"],
                                              trade["tp"],    trade["lot"])
                        else:
                            self.log(f">> ❌ Trade {i+1} failed: {trade['reason']}", "err")
                        if i < num_trades - 1:
                            time.sleep(2)  # Gap between orders

                self.sig_count += 1
                now = now_ts()
                tag = "buy" if signal == "BUY" else "sell"
                self.root.after(0, lambda s=signal, p=price,
                                sl_=sl, tp_=tp, wp=win_prob, n=now, t=tag:
                                self._add_history(n, s, p, sl_, tp_, wp, t))

            disconnect_mt5()

        except Exception as e:
            self.log(f">> ERROR: {e}", "err")
        finally:
            self.analyzing = False
            self.root.after(0, self._reset_gen_btn)

    def _update_ui(self, signal, price, sl, tp, rsi, macd,
                   bos, ob, win_prob, bal, eq, pnl, lot):
        color = G1 if signal == "BUY" else (RED if signal == "SELL" else TEXT3)
        self.sig_val.config(text=signal, fg=color)
        self.v_entry.config(text=str(price))
        self.v_sl.config(text=str(sl) if sl else "---")
        self.v_tp.config(text=str(tp) if tp else "---")
        self.v_lot.config(text=str(lot))
        self.prob_pct.config(text=f"{win_prob:.0f}%")
        self.prob_track.update_idletasks()
        w = int(self.prob_track.winfo_width() * win_prob / 100)
        self.prob_fill.place(x=0, y=0, relheight=1, width=max(w,0))
        self.v_rsi.config(text=str(rsi))
        self.v_macd.config(text=str(macd))
        self.v_bos.config(text=bos or "---")
        self.v_ob.config(text="FOUND" if ob else "---")
        self.v_bal.config(text=f"${bal:.2f}")
        self.v_eq.config(text=f"${eq:.2f}")
        self.v_pnl.config(text=f"${pnl:.2f}",
                           fg=G1 if pnl >= 0 else RED)
        self.m_sig.config(text=str(self.sig_count + 1))
        self.m_trade.config(text=str(self.trade_count))
        self.m_spread.config(text="0.3 pips")
        self.live_price_lbl.config(text=str(price))
        self._draw_chart()

        # Update exec button status
        if signal in ("BUY", "SELL"):
            ec = G1 if signal == "BUY" else RED
            self.exec_status.config(
                text=f"Ready → {signal} @ {price}", fg=ec)
        else:
            self.exec_status.config(
                text="No clear signal", fg=AMBER)

    def _reset_gen_btn(self):
        self.gen_btn.config(text="⚡  GENERATE SIGNAL",
                             state="normal", fg=G1)

    def _add_history(self, ts, sig, price, sl, tp, wp, tag):
        if self.tree.get_children():
            first = self.tree.get_children()[0]
            if "No signals" in str(self.tree.item(first)["values"]):
                self.tree.delete(first)
        self.tree.insert("", 0,
                          values=(ts, sig, price, sl, tp,
                                  f"{wp:.0f}%", "✓ SENT"),
                          tags=(tag,))

    # ── EXECUTE TRADE ─────────────────────────────────────────
    def execute_trade(self):
        if not self.last_signal_data:
            self.log(">> No signal! Press GENERATE SIGNAL first.", "err")
            self.exec_status.config(
                text="⚠ Generate signal first!", fg=AMBER)
            return

        signal = self.last_signal_data.get("signal")
        if signal not in ("BUY", "SELL"):
            self.log(">> No BUY/SELL signal to execute!", "err")
            self.exec_status.config(text="⚠ No valid signal", fg=AMBER)
            return

        self.exec_btn.config(text="⏳  PLACING ORDER...",
                              state="disabled", fg=TEXT3)
        self.exec_status.config(text="Connecting to MT5...", fg=TEXT3)
        self.log(f">> Manual execution: {signal}", "info")
        threading.Thread(target=self._do_execute, daemon=True).start()

    def _do_execute(self):
        try:
            from trader      import connect_mt5, disconnect_mt5, place_order
            from discord_bot import send_trade_result
            from config      import SYMBOL

            if not connect_mt5():
                self.log(">> MT5 connection failed!", "err")
                self.root.after(0, lambda: [
                    self.exec_btn.config(
                        text="🚀  EXECUTE TRADE NOW",
                        state="normal", fg=CYAN),
                    self.exec_status.config(
                        text="❌ MT5 failed", fg=RED)
                ])
                return

            signal = self.last_signal_data["signal"]
            num_trades = self.trade_count_var.get()
            self.log(f">> Placing {num_trades} {signal} order(s)...", "info")

            success_count = 0
            last_ticket   = None

            for i in range(num_trades):
                trade = place_order(signal)
                if trade["success"]:
                    success_count    += 1
                    self.trade_count += 1
                    last_ticket       = trade["ticket"]
                    self.log(f">> ✅ Order {i+1}/{num_trades}! Ticket:{trade['ticket']}", "ok")
                    self.log(f">> Price:{trade['price']} SL:{trade['sl']} TP:{trade['tp']}", "ok")
                    send_trade_result(
                        signal, SYMBOL, trade["ticket"],
                        trade["price"], trade["sl"],
                        trade["tp"],    trade["lot"])
                else:
                    self.log(f">> ❌ Order {i+1} failed: {trade['reason']}", "err")
                if i < num_trades - 1:
                    time.sleep(2)

            if success_count > 0:
                self.root.after(0, lambda sc=success_count, lt=last_ticket: [
                    self.exec_status.config(
                        text=f"✅ {sc} order(s) placed! Last: #{lt}", fg=G1),
                    self.m_trade.config(text=str(self.trade_count))
                ])
                self.log(">> Discord confirmation sent!", "info")
            else:
                self.log(f">> ❌ Failed: {trade['reason']}", "err")
                self.root.after(0, lambda r=trade["reason"]:
                                self.exec_status.config(
                                    text=f"❌ {r}", fg=RED))

            disconnect_mt5()

        except Exception as e:
            self.log(f">> ERROR: {e}", "err")
            self.root.after(0, lambda: self.exec_status.config(
                text="❌ Error", fg=RED))
        finally:
            self.root.after(0, lambda: self.exec_btn.config(
                text="🚀  EXECUTE TRADE NOW",
                state="normal", fg=CYAN))

    # ── AUTO SCAN ─────────────────────────────────────────────
    def start_scan(self):
        self.bot_running = True
        self.scan_btn.config(state="disabled")
        self.stop_btn.config(state="normal")
        self.log(">> Auto scan activated — every 60s...", "ok")
        threading.Thread(target=self._scan_loop, daemon=True).start()

    def _scan_loop(self):
        while self.bot_running:
            self.root.after(0, self.generate_signal)
            time.sleep(60)

    def stop_scan(self):
        self.bot_running = False
        self.scan_btn.config(state="normal")
        self.stop_btn.config(state="disabled")
        self.status_lbl.config(text="● MT5 OFFLINE", fg=RED)
        self.log(">> Auto scan stopped.", "err")


if __name__ == "__main__":
    root = tk.Tk()
    app  = YasoApp(root)
    root.mainloop()
