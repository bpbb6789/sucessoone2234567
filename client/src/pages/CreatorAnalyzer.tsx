
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Eye, 
  Heart, 
  Share2, 
  Code, 
  GitBranch, 
  Star,
  Globe,
  Gauge,
  Sparkles,
  Rocket,
  BarChart3,
  Activity,
  Zap,
  Github,
  Twitter,
  Linkedin,
  ExternalLink,
  Calculator,
  Target,
  Flame,
  TrendingDown
} from 'lucide-react';

interface AnalysisResult {
  platform: string;
  followers: number;
  engagement: number;
  trending: boolean;
  trendMultiplier: number;
  baseValue: number;
  marketCapEstimate: number;
  confidence: number;
  growthPotential: 'Low' | 'Medium' | 'High' | 'Very High';
  tokenRecommendation: string;
}

interface BuilderMetrics {
  githubStars: number;
  repositories: number;
  contributions: number;
  followers: number;
  techs: string[];
  projectType: 'Open Source' | 'Startup' | 'Enterprise' | 'DeFi' | 'NFT' | 'Gaming' | 'Infrastructure';
}

export default function CreatorAnalyzer() {
  const [activeTab, setActiveTab] = useState('creators');
  const [inputUrl, setInputUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [builderMetrics, setBuilderMetrics] = useState<BuilderMetrics | null>(null);
  const [realTimeMultiplier, setRealTimeMultiplier] = useState(1.0);
  const { toast } = useToast();

  // Simulate real-time trending updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeMultiplier(prev => {
        const change = (Math.random() - 0.5) * 0.1;
        const newValue = Math.max(0.5, Math.min(3.0, prev + change));
        return parseFloat(newValue.toFixed(2));
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const analyzeCreator = async () => {
    if (!inputUrl.trim()) {
      toast({
        title: "Missing URL",
        description: "Please enter a social media URL or username",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock analysis based on URL
      const platform = getPlatformFromUrl(inputUrl);
      const mockMetrics = generateMockMetrics(platform);
      
      setAnalysisResult(mockMetrics);
      
      toast({
        title: "Analysis Complete! 🎯",
        description: `Estimated market cap: $${mockMetrics.marketCapEstimate.toLocaleString()}`
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze creator. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeBuilder = async () => {
    if (!inputUrl.trim()) {
      toast({
        title: "Missing URL",
        description: "Please enter a GitHub profile, project URL, or developer handle",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2500));

      const builderData = generateBuilderMetrics(inputUrl);
      const creatorAnalysis = generateBuilderTokenAnalysis(builderData);
      
      setBuilderMetrics(builderData);
      setAnalysisResult(creatorAnalysis);
      
      toast({
        title: "Builder Analysis Complete! 🔧",
        description: `Project token potential: $${creatorAnalysis.marketCapEstimate.toLocaleString()}`
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze builder profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPlatformFromUrl = (url: string): string => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('tiktok.com')) return 'TikTok';
    if (url.includes('instagram.com')) return 'Instagram';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'Twitter';
    if (url.includes('twitch.tv')) return 'Twitch';
    if (url.includes('linkedin.com')) return 'LinkedIn';
    return 'Social Media';
  };

  const generateMockMetrics = (platform: string): AnalysisResult => {
    const followers = Math.floor(Math.random() * 1000000) + 5000;
    const engagement = Math.floor(Math.random() * 10) + 2;
    const trending = Math.random() > 0.7;
    const trendMultiplier = trending ? realTimeMultiplier * 1.5 : realTimeMultiplier;
    
    const baseValue = followers * 0.001 + engagement * 100;
    const marketCapEstimate = Math.floor(baseValue * trendMultiplier);
    
    return {
      platform,
      followers,
      engagement,
      trending,
      trendMultiplier,
      baseValue,
      marketCapEstimate,
      confidence: Math.floor(Math.random() * 30) + 70,
      growthPotential: ['Low', 'Medium', 'High', 'Very High'][Math.floor(Math.random() * 4)] as any,
      tokenRecommendation: trending ? 'Launch Now - Trending!' : 'Good Time to Launch'
    };
  };

  const generateBuilderMetrics = (url: string): BuilderMetrics => {
    const techStacks = [
      ['React', 'TypeScript', 'Node.js'],
      ['Python', 'Django', 'PostgreSQL'], 
      ['Solidity', 'Web3.js', 'Hardhat'],
      ['Rust', 'Substrate', 'Polkadot'],
      ['Go', 'Docker', 'Kubernetes'],
      ['JavaScript', 'Vue.js', 'MongoDB']
    ];

    return {
      githubStars: Math.floor(Math.random() * 10000) + 100,
      repositories: Math.floor(Math.random() * 200) + 10,
      contributions: Math.floor(Math.random() * 2000) + 100,
      followers: Math.floor(Math.random() * 5000) + 50,
      techs: techStacks[Math.floor(Math.random() * techStacks.length)],
      projectType: ['Open Source', 'Startup', 'DeFi', 'NFT', 'Gaming', 'Infrastructure'][Math.floor(Math.random() * 6)] as any
    };
  };

  const generateBuilderTokenAnalysis = (builderData: BuilderMetrics): AnalysisResult => {
    // Builder-specific valuation logic
    const starWeight = builderData.githubStars * 0.5;
    const repoWeight = builderData.repositories * 20;
    const contributionWeight = builderData.contributions * 2;
    const followerWeight = builderData.followers * 3;
    
    const projectTypeMultiplier = {
      'Open Source': 1.2,
      'Startup': 1.8,
      'Enterprise': 1.5,
      'DeFi': 2.5,
      'NFT': 2.0,
      'Gaming': 2.2,
      'Infrastructure': 1.7
    };

    const baseValue = starWeight + repoWeight + contributionWeight + followerWeight;
    const typeMultiplier = projectTypeMultiplier[builderData.projectType];
    const trendMultiplier = realTimeMultiplier;
    
    const marketCapEstimate = Math.floor(baseValue * typeMultiplier * trendMultiplier);
    
    return {
      platform: 'Developer Ecosystem',
      followers: builderData.followers,
      engagement: Math.floor((builderData.githubStars + builderData.contributions) / 100),
      trending: builderData.projectType === 'DeFi' || builderData.projectType === 'Gaming',
      trendMultiplier,
      baseValue,
      marketCapEstimate,
      confidence: Math.floor(Math.random() * 25) + 75,
      growthPotential: builderData.githubStars > 1000 ? 'Very High' : builderData.githubStars > 500 ? 'High' : 'Medium',
      tokenRecommendation: builderData.projectType === 'DeFi' ? 'High Demand - Launch Soon!' : 'Strong Community Potential'
    };
  };

  const MarketCapGauge = ({ value, max = 100000 }: { value: number; max?: number }) => {
    const percentage = Math.min((value / max) * 100, 100);
    
    return (
      <div className="relative">
        <div className="flex items-center justify-center w-48 h-48 mx-auto">
          <div className="relative w-40 h-40 rounded-full border-8 border-gray-200 dark:border-gray-700">
            <div 
              className="absolute inset-0 rounded-full border-8 border-purple-500 transition-all duration-1000"
              style={{
                background: `conic-gradient(from 0deg, #8b5cf6 ${percentage * 3.6}deg, transparent ${percentage * 3.6}deg)`
              }}
            />
            <div className="absolute inset-4 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">${(value / 1000).toFixed(1)}K</div>
                <div className="text-xs text-muted-foreground">Market Cap</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>$0</span>
          <span>${(max / 1000).toFixed(0)}K</span>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calculator className="h-10 w-10 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Creator Analyzer
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Discover what your Web2 accounts would be worth if tokenized on our Web3 platform. 
            Real-time market analysis with trending multipliers and growth potential assessment.
          </p>
        </div>

        {/* Real-time Trending Indicator */}
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-orange-500 animate-pulse" />
                <span className="font-medium">Live Market Sentiment</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={realTimeMultiplier > 1.2 ? "default" : realTimeMultiplier < 0.8 ? "destructive" : "secondary"}>
                  {realTimeMultiplier > 1.2 ? <TrendingUp className="h-3 w-3 mr-1" /> : 
                   realTimeMultiplier < 0.8 ? <TrendingDown className="h-3 w-3 mr-1" /> : 
                   <Activity className="h-3 w-3 mr-1" />}
                  {realTimeMultiplier}x Multiplier
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="creators" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="creators" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Content Creators
            </TabsTrigger>
            <TabsTrigger value="builders" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Builders & Developers
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Web3 Projects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="creators" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Creator Account Analysis
                </CardTitle>
                <p className="text-muted-foreground">
                  Paste your YouTube, TikTok, Instagram, Twitter, or Twitch profile to see its tokenization potential
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <Label htmlFor="creator-url">Social Media URL or Handle</Label>
                    <Input
                      id="creator-url"
                      placeholder="https://youtube.com/@creator or @username"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={analyzeCreator}
                      disabled={isAnalyzing}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      {isAnalyzing ? <Zap className="mr-2 h-4 w-4 animate-spin" /> : <Target className="mr-2 h-4 w-4" />}
                      Analyze Creator
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">YouTube</Badge>
                    Subscribers & views
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">TikTok</Badge>
                    Followers & engagement
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Instagram</Badge>
                    Posts & reach
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Twitter</Badge>
                    Tweets & influence
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="builders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Builder & Developer Analysis
                </CardTitle>
                <p className="text-muted-foreground">
                  Analyze GitHub profiles, development projects, and technical contributions to estimate project token value
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <Label htmlFor="builder-url">GitHub Profile, Project URL, or Developer Handle</Label>
                    <Input
                      id="builder-url"
                      placeholder="https://github.com/developer or project URL"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={analyzeBuilder}
                      disabled={isAnalyzing}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      {isAnalyzing ? <Zap className="mr-2 h-4 w-4 animate-spin" /> : <Github className="mr-2 h-4 w-4" />}
                      Analyze Builder
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-green-500 text-green-600">
                      <Star className="h-3 w-3 mr-1" />
                      GitHub Stars
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-blue-500 text-blue-600">
                      <GitBranch className="h-3 w-3 mr-1" />
                      Contributions
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-purple-500 text-purple-600">
                      <Code className="h-3 w-3 mr-1" />
                      Tech Stack
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-orange-500 text-orange-600">
                      <Rocket className="h-3 w-3 mr-1" />
                      Project Type
                    </Badge>
                  </div>
                </div>

                {/* Builder-specific info */}
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      Builder Token Factors
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <div className="font-medium">GitHub Activity</div>
                        <div className="text-muted-foreground">Stars, forks, commits</div>
                      </div>
                      <div>
                        <div className="font-medium">Tech Stack</div>
                        <div className="text-muted-foreground">Languages, frameworks</div>
                      </div>
                      <div>
                        <div className="font-medium">Project Impact</div>
                        <div className="text-muted-foreground">Usage, adoption</div>
                      </div>
                      <div>
                        <div className="font-medium">Community</div>
                        <div className="text-muted-foreground">Followers, contributors</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* Builder Metrics Display */}
            {builderMetrics && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Github className="h-5 w-5 text-green-600" />
                    Builder Profile Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{builderMetrics.githubStars.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">GitHub Stars</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{builderMetrics.repositories}</div>
                      <div className="text-sm text-muted-foreground">Repositories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{builderMetrics.contributions.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Contributions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{builderMetrics.followers.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Followers</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Tech Stack:</span>
                      <Badge variant="outline" className="border-orange-500 text-orange-600">
                        {builderMetrics.projectType}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {builderMetrics.techs.map((tech, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  Web3 Project Analysis
                </CardTitle>
                <p className="text-muted-foreground">
                  Analyze existing Web3 projects, DAOs, and protocols to benchmark your potential token value
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <Label htmlFor="project-url">Project Website or Contract Address</Label>
                    <Input
                      id="project-url"
                      placeholder="https://project.com or 0x..."
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={analyzeCreator}
                      disabled={isAnalyzing}
                      className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                    >
                      {isAnalyzing ? <Zap className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />}
                      Analyze Project
                    </Button>
                  </div>
                </div>

                <div className="text-center text-muted-foreground">
                  <div className="text-sm">Coming soon: TVL analysis, governance metrics, and community size evaluation</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Market Cap Gauge */}
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  Estimated Market Cap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MarketCapGauge value={analysisResult.marketCapEstimate} />
                
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Platform:</span>
                    <Badge variant="outline">{analysisResult.platform}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Confidence:</span>
                    <div className="flex items-center gap-2">
                      <Progress value={analysisResult.confidence} className="w-20" />
                      <span className="text-sm font-medium">{analysisResult.confidence}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Growth Potential:</span>
                    <Badge variant={
                      analysisResult.growthPotential === 'Very High' ? 'default' :
                      analysisResult.growthPotential === 'High' ? 'secondary' : 'outline'
                    }>
                      {analysisResult.growthPotential}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Trending Status:</span>
                    <div className="flex items-center gap-1">
                      {analysisResult.trending ? (
                        <Badge className="bg-orange-500 hover:bg-orange-600">
                          <Flame className="h-3 w-3 mr-1" />
                          Trending
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          Normal
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Valuation Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {analysisResult.followers.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {activeTab === 'builders' ? 'GitHub Followers' : 'Followers'}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {analysisResult.engagement.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {activeTab === 'builders' ? 'Activity Score' : 'Engagement Rate'}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Base Value</span>
                      <span>${analysisResult.baseValue.toLocaleString()}</span>
                    </div>
                    <Progress value={50} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Trend Multiplier</span>
                      <span className={analysisResult.trending ? "text-orange-600" : ""}>
                        {analysisResult.trendMultiplier.toFixed(2)}x
                      </span>
                    </div>
                    <Progress value={Math.min(analysisResult.trendMultiplier * 33, 100)} className={
                      analysisResult.trending ? "bg-orange-200 dark:bg-orange-900" : ""
                    } />
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Final Estimate:</span>
                      <span className="text-xl font-bold text-purple-600">
                        ${analysisResult.marketCapEstimate.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Recommendation</span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {analysisResult.tokenRecommendation}
                    </p>
                  </CardContent>
                </Card>

                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Rocket className="mr-2 h-4 w-4" />
                  Create Token for This {activeTab === 'builders' ? 'Project' : 'Account'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* How It Works Section */}
        <Card className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20">
          <CardHeader>
            <CardTitle>How Our Analysis Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Content Creators
                </h3>
                <p className="text-sm text-muted-foreground">
                  We analyze follower counts, engagement rates, content quality, and social sentiment 
                  to estimate your Web2 audience value in Web3 terms.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Builders & Developers
                </h3>
                <p className="text-sm text-muted-foreground">
                  GitHub stars, contribution history, tech stack popularity, and project impact 
                  determine your development work's potential token value.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Real-time Trends
                </h3>
                <p className="text-sm text-muted-foreground">
                  Live market sentiment, trending topics, and social buzz apply dynamic multipliers 
                  to your base valuation for accurate timing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
