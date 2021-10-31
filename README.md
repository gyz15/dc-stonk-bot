# ʕ ◔ᴥ◔ ʔ dc-stonk-bot

A discord slash bot for you to perform quick check on the stock you like.

## ⚙️ Tools Used

- Cloudflare worker (host the bot)
- Cloudflare KV (Store the api key)
- Discord bot

## ⚠️ Disclaimer

The content is intended to be used and must be used for information and education purposes only. It is very important to do your own analysis before making any investment based on your own personal circumstances.

## 🔋 Getting Started

1. Setup your [Cloudflare account](https://dash.cloudflare.com).
2. Head over to [Alpha Vantage](https://www.alphavantage.co/support/#api-key) to claim for a free API Key.
3. Clone this repository by running this command:
   ```bash
    git clone https://github.com/gyz15/dc-stonk-bot
   ```
4. Install the dependencies by running this command:
   ```bash
    npm install
   ```
5. Create a KV namespace by using the following command,:
   ```bash
    wrangler kv:namespace create "CONFIG"
   ```
   Copy the id of the KV namespace and replace the original id in [`wrangler.toml`](./wrangler.toml).  
   Then, run this command to store the API Key in the KV namespace. Replace the "<API_KEY>" with the key generated in step 2.
   ```bash
    wrangler kv:key put --binding=CONFIG API_KEY <API_KEY>
   ```
6. These fields in [`wrangler.toml`](./wrangler.toml) should be edited.

   ```
    (Required)
    account_id="<YOUR_ACCOUNT_ID>"
    kv_namespaces = [
        { binding = "CONFIG",id = "<NEW_KV_NAMESPACE_ID>" }
    ]

    (Optional)
    name="<CUSTOM_NAME>"
   ```

7. Head over to ['Discord Developer Portal'](https://discord.com/developers) to create a new application. Copy the "APPLICATION ID" and "PUBLIC KEY". Edit these field in [`src/index.ts`](./src/index.ts).
8. By using the following command, put the APPLICATION_SECRET of your discord application into your worker:
   ```bash
    wrangler secret put APPLICATION_SECRET
   ```
9. You're all set and run the following command to publish your bot.
   ```bash
    wrangler publish
   ```
   ⚠️Error I ran in: "APPLICATION_SECRET not defined". Able to solve it by changing the variable to a random string, after successfully publish run step 8 and 9 again(change the string back to variable).
10. Copy the url of your bot. Head over to the Discord Developer Portal and add "<YOUR_BOT_URL>/interaction" as the interaction endpoint url. E.g. "https://dc-stonk-bot.workers.dev/interaction"
11. Head over to "<YOUR_BOT_URL>/setup" to register the command. Note that it might return an error but it will still work. (Idk why that's happening🥴)
12. Head over to "<YOUR_BOT_URL>/" to authorize and add the bot to the server. Wait for about 10-15 minutes before the slash command is registered.

### 👩 💻 Developing

Feel free to edit the code based on your needs in [`src/index.ts`](./src/index.ts). Please be note that by enabling the bot to return both **annually and quarterly data** in a response might cause an error (Message character count > 2000)

### 👀 Previewing and Publishing

For information on how to preview and publish your worker, please see the [Wrangler docs](https://developers.cloudflare.com/workers/tooling/wrangler/commands/#publish).

## 🤢 Issues

If you run into issues with this specific project, please feel free to file an issue [here](https://github.com/gyz15/dc-stonk-bot/issues). If the problem is with Wrangler, please file an issue [here](https://github.com/cloudflare/wrangler/issues).
