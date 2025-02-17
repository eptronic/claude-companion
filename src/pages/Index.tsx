
import { useState } from "react";
import { MessageSquare, File, Folder, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const Index = () => {
  const [apiKey, setApiKey] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      toast({
        title: "Error",
        description: "Please enter your Claude API key",
        variant: "destructive",
      });
      return;
    }

    if (!inputMessage.trim()) {
      return;
    }

    const newMessages = [
      ...messages,
      { role: "user", content: inputMessage },
    ];
    setMessages(newMessages);
    setInputMessage("");

    // TODO: Implement Claude API call here
  };

  const sidebarItems = [
    { title: "Chat", icon: MessageSquare },
    { title: "Files", icon: File },
    { title: "Projects", icon: Folder },
    { title: "Search", icon: Search },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton>
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {!apiKey && (
              <div className="mb-8 p-6 rounded-lg border animate-fade-in">
                <h2 className="text-xl font-semibold mb-4">Welcome to Claude Chat</h2>
                <div className="space-y-4">
                  <input
                    type="password"
                    placeholder="Enter your Claude API key"
                    className="w-full p-2 border rounded"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Your API key is stored locally and never sent to our servers.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4 mb-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground ml-12"
                      : "bg-muted mr-12"
                  }`}
                >
                  {message.content}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
