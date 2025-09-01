
import { Book, FileText, Code, ExternalLink, ArrowRight, Github, Play, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const quickStartGuides = [
  { title: "Create Your First Token", href: "#create-token", description: "Learn the basics of token creation on our platform" },
  { title: "Trading Guide", href: "#trading", description: "Start trading tokens with confidence" },
  { title: "Wallet Setup", href: "#wallet", description: "Connect and configure your wallet" }
];

const apiDocs = [
  { title: "REST API", href: "#api", description: "Complete API reference" },
  { title: "Smart Contracts", href: "#contracts", description: "Contract addresses and ABIs" },
  { title: "GraphQL", href: "#graphql", description: "Query our GraphQL endpoint" }
];

const resources = [
  { title: "Community Guidelines", href: "#guidelines", description: "Rules and best practices" },
  { title: "Security Guide", href: "#security", description: "Keep your assets safe" },
  { title: "Token Standards", href: "#standards", description: "Technical specifications" }
];

export default function Doc() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-doc">
      {/* Hero Section */}
      <div className="border-b bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Book className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Documentation</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Everything you need to build, trade, and succeed on our platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2">
              <Play className="h-4 w-4" />
              Quick Start
            </Button>
            <Button variant="outline" size="lg" className="gap-2">
              <Github className="h-4 w-4" />
              View on GitHub
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Quick Start */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Quick Start</h2>
            <p className="text-muted-foreground text-lg">Get up and running in minutes</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {quickStartGuides.map((guide, index) => (
              <Card key={guide.title} className="relative group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <CardTitle className="text-lg">{guide.title}</CardTitle>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{guide.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* API Reference */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">API Reference</h2>
            <p className="text-muted-foreground text-lg">Technical documentation for developers</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {apiDocs.map((doc) => (
              <Card key={doc.title} className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Code className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{doc.title}</CardTitle>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{doc.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Resources */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Resources</h2>
            <p className="text-muted-foreground text-lg">Community guidelines and best practices</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {resources.map((resource) => (
              <Card key={resource.title} className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{resource.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Support Section */}
        <section className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-12">
              <h3 className="text-2xl font-bold mb-4">Need Help?</h3>
              <p className="text-muted-foreground mb-8">
                Join our community or reach out to our support team
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="gap-2">
                  Join Discord
                </Button>
                <Button variant="outline" className="gap-2">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
