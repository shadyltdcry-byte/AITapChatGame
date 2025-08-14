import os
import json
import requests
from bs4 import BeautifulSoup
from telegram import Update, InputMediaPhoto
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

BOT_TOKEN = os.environ.get("BOT_TOKEN", "7513981050:AAGcpSnd75FnPCzznJy_Vrqwe982f5nBTcY")
SITES_FILE = "sites.json"

    # Ensure sites.json exists and is valid
if not os.path.exists(SITES_FILE):
        with open(SITES_FILE, "w") as f:
            json.dump({}, f)

try:
        with open(SITES_FILE, "r") as f:
            sites = json.load(f)
except json.JSONDecodeError:
        sites = {}
        with open(SITES_FILE, "w") as f:
            json.dump(sites, f)

def save_sites():
        with open(SITES_FILE, "w") as f:
            json.dump(sites, f, indent=4)

    # --- Commands ---
async def add_site(update: Update, context: ContextTypes.DEFAULT_TYPE):
        if len(context.args) < 5:
            await update.message.reply_text(
                "Usage:\n/addsite name url title_selector link_selector desc_selector thumb_selector\n"
                "Example:\n/addsite example https://example.com/search?q={} h3.title a.result p.desc img.thumb"
            )
            return
        name = context.args[0]
        sites[name] = {
            "url": context.args[1],
            "title": context.args[2],
            "link": context.args[3],
            "desc": context.args[4],
            "thumb": context.args[5]
        }
        save_sites()
        await update.message.reply_text(f"Added site: {name}")

async def remove_site(update: Update, context: ContextTypes.DEFAULT_TYPE):
        if not context.args:
            await update.message.reply_text("Usage: /removesite name")
            return
        name = context.args[0]
        if name in sites:
            del sites[name]
            save_sites()
            await update.message.reply_text(f"Removed site: {name}")
        else:
            await update.message.reply_text("Site not found.")

async def list_sites(update: Update, context: ContextTypes.DEFAULT_TYPE):
        if not sites:
            await update.message.reply_text("No  added yet.")
            return
        text = "\n".join([f"{i+1}. {name}" for i, name in enumerate(sites.keys())])
        await update.message.reply_text(f"Sites:\n{text}")

async def search(update: Update, context: ContextTypes.DEFAULT_TYPE):
        if not context.args:
            await update.message.reply_text("Usage: /search keywords")
            return
        query = " ".join(context.args)
        if not sites:
            await update.message.reply_text("No sites configured.")
            return

        results = []
        for name, config in sites.items():
            url = config["url"].format(query.replace(" ", "+"))
            headers = {"User-Agent": "Mozilla/5.0"}
            try:
                r = requests.get(url, headers=headers, timeout=10)
                r.raise_for_status()
            except Exception as e:
                await update.message.reply_text(f"Error fetching {name}: {e}")
                continue

            soup = BeautifulSoup(r.text, "html.parser")

            titles = soup.select(config["title"])
            links = soup.select(config["link"])
            descs = soup.select(config["desc"])
            thumbs = soup.select(config["thumb"])

            for i in range(min(3, len(titles))):  # top 3 per site
                title = titles[i].get_text(strip=True)
                link = links[i].get("href")
                if not link.startswith("http"):
                    link = config["url"].split("/search")[0] + link
                description = descs[i].get_text(strip=True) if i < len(descs) else ""
                thumb_url = thumbs[i].get("src") if i < len(thumbs) else None

                caption = f"{title}\n{description}\n{link}"
                if thumb_url:
                    results.append(InputMediaPhoto(media=thumb_url, caption=caption))
                else:
                    await update.message.reply_text(caption)

        # Send in batches of 10 to avoid Telegram 1016 error
        for i in range(0, len(results), 10):
            await update.message.reply_media_group(results[i:i+10])

    # --- Bot setup ---
app = ApplicationBuilder().token(BOT_TOKEN).build()
app.add_handler(CommandHandler("addsite", add_site))
app.add_handler(CommandHandler("removesite", remove_site))
app.add_handler(CommandHandler("list", list_sites))
app.add_handler(CommandHandler("search", search))

if __name__ == "__main__":
        print("Bot started...")
        app.run_polling()