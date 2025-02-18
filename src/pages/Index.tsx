
import { useState, useEffect } from "react";
import { MessageSquare, File, Folder, Search, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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

type MessageContent = {
  type?: string;
  text?: string;
} | string;

interface Message {
  role: string;
  content: MessageContent;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);

  const fetchConversationHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase.functions.invoke('claude-history', {
        body: {},
      });

      if (error) throw error;
      if (data) {
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        title: "Error",
        description: "Failed to fetch conversation history.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchConversationHistory();
  }, []);

  const handleNewChat = () => {
    setMessages([]);
    setInputMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage) {
      return;
    }

    setIsLoading(true);

    const newMessage = { role: "user", content: trimmedMessage };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputMessage("");

    try {
      const { data, error } = await supabase.functions.invoke('chat-with-claude', {
        body: {
          messages: updatedMessages
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data?.content) {
        setMessages([...updatedMessages, { role: "assistant", content: data.content }]);
      } else {
        throw new Error('No content in response');
      }
    } catch (error) {
      console.error('Error calling Claude:', error);
      toast({
        title: "Error",
        description: "Failed to get a response from Claude. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMessageContent = (content: MessageContent): string => {
    if (typeof content === 'string') {
      return content;
    }
    return content.text || '';
  };

  const sidebarItems = [
    { 
      title: "New Chat", 
      icon: MessageSquare,
      onClick: handleNewChat 
    },
    { 
      title: "Files", 
      icon: File,
      onClick: () => {
        if (isLoadingHistory) {
          toast({
            title: "Loading",
            description: "Please wait while we fetch your conversation history.",
          });
          return;
        }
        if (conversations.length === 0) {
          toast({
            title: "No Files",
            description: "No conversation files found in your history.",
          });
          return;
        }
        // Handle displaying conversation files
        toast({
          title: "Files",
          description: `Found ${conversations.length} conversations in your history.`,
        });
      }
    },
    { 
      title: "Projects", 
      icon: Folder,
      onClick: () => {
        if (isLoadingHistory) {
          toast({
            title: "Loading",
            description: "Please wait while we fetch your projects.",
          });
          return;
        }
        // Handle projects view
        toast({
          title: "Projects",
          description: "Project organization coming soon.",
        });
      }
    },
    { 
      title: "Search", 
      icon: Search,
      onClick: () => {
        if (isLoadingHistory) {
          toast({
            title: "Loading",
            description: "Please wait while we initialize search.",
          });
          return;
        }
        // Handle search functionality
        toast({
          title: "Search",
          description: "Search functionality coming soon.",
        });
      }
    },
  ];

  return (
    <div className="w-screen h-screen overflow-hidden bg-background">
      <SidebarProvider>
        <div className="h-full flex">
          <Sidebar className="border-r border-border bg-card">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel className="text-muted-foreground">
                  {isLoadingHistory ? "Loading..." : "Navigation"}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {sidebarItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          className="hover:bg-muted"
                          onClick={item.onClick}
                        >
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

          <main className="flex-1 flex flex-col h-screen">
            <div className="flex-1 overflow-auto">
              <div className="max-w-4xl mx-auto p-6">
                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-lg ${
                          message.role === "user"
                            ? "bg-primary/90 text-primary-foreground"
                            : "bg-card text-card-foreground border border-border"
                        }`}
                      >
                        {getMessageContent(message.content)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full">
              <form onSubmit={handleSubmit} className="p-4">
                <div className="flex gap-2 items-center max-w-4xl mx-auto">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 p-3 bg-card text-foreground border-border border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/70"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:hover:bg-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Sending..."
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Index;
