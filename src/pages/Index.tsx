
import { useState, useEffect } from "react";
import { MessageSquare, Send, ChevronDown, ChevronRight, Menu } from "lucide-react";
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
  SidebarMenuSub,
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    history: true
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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
    if (!trimmedMessage) return;

    setIsLoading(true);

    const newMessage = { role: "user", content: trimmedMessage };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputMessage("");

    try {
      const { data, error } = await supabase.functions.invoke('chat-with-claude', {
        body: { messages: updatedMessages },
      });

      if (error) throw error;

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

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out.",
        variant: "destructive",
      });
    }
  };

  const getMessageContent = (content: MessageContent): string => {
    if (typeof content === 'string') return content;
    return content.text || '';
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-background">
      <SidebarProvider>
        <div className="h-full flex relative">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary/10 rounded-md hover:bg-primary/20 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Sidebar */}
          <div className={`fixed inset-y-0 left-0 transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-200 ease-in-out z-30 w-64`}>
            <Sidebar className="h-full border-r border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <SidebarContent>
                <SidebarGroup>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        className="hover:bg-muted"
                        onClick={handleNewChat}
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span>New Chat</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        className="hover:bg-muted text-destructive"
                        onClick={handleLogout}
                      >
                        <span>Log Out</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>

                  <div className="mt-4">
                    <SidebarGroupLabel 
                      className="flex items-center justify-between px-2 cursor-pointer hover:text-primary"
                      onClick={() => toggleSection('history')}
                    >
                      <span>Chat History</span>
                      {expandedSections.history ? 
                        <ChevronDown className="w-4 h-4" /> : 
                        <ChevronRight className="w-4 h-4" />
                      }
                    </SidebarGroupLabel>
                    {expandedSections.history && (
                      <SidebarMenuSub>
                        {isLoadingHistory ? (
                          <div className="px-2 py-1 text-sm text-muted-foreground">Loading history...</div>
                        ) : conversations.length > 0 ? (
                          conversations.map((conv, index) => (
                            <SidebarMenuItem key={index}>
                              <SidebarMenuButton 
                                className="text-sm truncate hover:bg-muted"
                                onClick={() => {
                                  toast({
                                    description: "Loading conversation...",
                                  });
                                }}
                              >
                                <MessageSquare className="w-4 h-4" />
                                <span>{conv.title || `Conversation ${index + 1}`}</span>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))
                        ) : (
                          <div className="px-2 py-1 text-sm text-muted-foreground">No chat history</div>
                        )}
                      </SidebarMenuSub>
                    )}
                  </div>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>
          </div>

          {/* Main Content */}
          <main className="flex-1 flex flex-col h-screen lg:ml-0 relative">
            <div className="flex-1 overflow-auto px-4 lg:px-0">
              <div className="max-w-4xl mx-auto py-6">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
                    <MessageSquare className="w-12 h-12 text-muted-foreground/50" />
                    <h2 className="text-2xl font-semibold text-foreground/80">Welcome to Claude Companion</h2>
                    <p className="text-muted-foreground max-w-sm">Start a new conversation with Claude by typing your message below.</p>
                  </div>
                ) : (
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
                              ? "bg-primary text-primary-foreground"
                              : "bg-card text-card-foreground border border-border"
                          }`}
                        >
                          {getMessageContent(message.content)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Input Form */}
            <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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

          {/* Mobile Overlay */}
          {isMobileSidebarOpen && (
            <div 
              className="fixed inset-0 bg-background/80 backdrop-blur-sm lg:hidden z-20"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Index;
