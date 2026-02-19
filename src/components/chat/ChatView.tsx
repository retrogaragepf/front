import ChatPanel from "./ChatPanel";
import { sampleConversations, sampleMessages } from "@/src/helpers/chat.mock";

const ChatView = () => {
  const activeConversation = sampleConversations[0];

  return (
    <ChatPanel
      conversations={sampleConversations}
      activeConversation={activeConversation}
      messages={sampleMessages}
    />
  );
}

export default ChatView;
