import { NextResponse } from "next/server";

export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const channelUsername = process.env.TELEGRAM_CHANNEL_USERNAME;

  if (!botToken || !channelUsername) {
    return NextResponse.json(
      { error: "Telegram Bot Token or Channel Username not configured" },
      { status: 500 }
    );
  }

  try {
    // Get channel info (member count)
    const chatRes = await fetch(
      `https://api.telegram.org/bot${botToken}/getChat?chat_id=@${channelUsername}`,
      { next: { revalidate: 3600 } }
    );
    const chatData = await chatRes.json();

    if (!chatData.ok) {
      return NextResponse.json(
        { error: `Telegram API error: ${chatData.description}` },
        { status: 500 }
      );
    }

    // Get member count
    const countRes = await fetch(
      `https://api.telegram.org/bot${botToken}/getChatMemberCount?chat_id=@${channelUsername}`,
      { next: { revalidate: 3600 } }
    );
    const countData = await countRes.json();

    const chat = chatData.result;

    return NextResponse.json({
      channel: {
        title: chat.title || channelUsername,
        username: chat.username || channelUsername,
        description: chat.description || "",
        members: countData.ok ? countData.result : 0,
        type: chat.type,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch Telegram data" },
      { status: 500 }
    );
  }
}
