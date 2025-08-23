
import { Book, FileText, Code, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const docSections = [
  {
    title: "Getting Started",
    description: "Learn the basics of token creation and trading",
    items: [
      { title: "How to Create a Token", href: "#create-token", type: "guide" },
      { title: "Trading Tutorial", href: "#trading", type: "guide" },
      { title: "Wallet Setup", href: "#wallet", type: "guide" },
      { title: "Understanding Fees", href: "#fees", type: "guide" }
    ]
  },
  {
    title: "API Reference",
    description: "Technical documentation for developers",
    items: [
      { title: "REST API Endpoints", href: "#api", type: "technical" },
      { title: "Smart Contract ABI", href: "#abi", type: "technical" },
      { title: "GraphQL Schema", href: "#graphql", type: "technical" },
      { title: "WebSocket Events", href: "#websocket", type: "technical" }
    ]
  },
  {
    title: "Community",
    description: "Resources and community guidelines",
    items: [
      { title: "Community Guidelines", href: "#guidelines", type: "community" },
      { title: "Token Standards", href: "#standards", type: "community" },
      { title: "Best Practices", href: "#practices", type: "community" },
      { title: "Security Tips", href: "#security", type: "community" }
    ]
  }
];

const getBadgeColor = (type: string) => {
  switch (type) {
    case 'guide':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'technical':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'community':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

export default function Doc() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6" data-testid="page-doc">
      <div className="flex items-center gap-2 mb-6">
        <Book className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Documentation</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {docSections.map((section) => (
          <Card key={section.title} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {section.title}
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {section.description}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getBadgeColor(item.type)}>
                        {item.type}
                      </Badge>
                      <ExternalLink className="h-3 w-3 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Code className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h4 className="font-medium">Smart Contracts</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View deployed contracts on Base
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Book className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h4 className="font-medium">Video Tutorials</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Step-by-step video guides
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <ExternalLink className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h4 className="font-medium">GitHub</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Open source code repository
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
