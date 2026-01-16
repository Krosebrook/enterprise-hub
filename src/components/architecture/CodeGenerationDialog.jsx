import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Code,
  Download,
  Copy,
  CheckCircle,
  Loader2,
  Cloud,
  Database,
  Network,
  Server,
  FileCode,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const cloudProviders = [
  { id: "aws", name: "Amazon Web Services (AWS)", icon: Cloud, color: "text-orange-600" },
  { id: "gcp", name: "Google Cloud Platform (GCP)", icon: Cloud, color: "text-blue-600" },
  { id: "azure", name: "Microsoft Azure", icon: Cloud, color: "text-sky-600" },
];

const infrastructureComponents = {
  networking: {
    label: "Networking",
    icon: Network,
    options: [
      { id: "vpc", label: "VPC/Virtual Network", description: "Private network with subnets" },
      { id: "load_balancer", label: "Load Balancer", description: "Application load balancer" },
      { id: "nat_gateway", label: "NAT Gateway", description: "Outbound internet access" },
      { id: "security_groups", label: "Security Groups", description: "Firewall rules" },
    ],
  },
  compute: {
    label: "Compute",
    icon: Server,
    options: [
      { id: "kubernetes", label: "Kubernetes Cluster", description: "EKS / GKE / AKS" },
      { id: "node_pools", label: "Node Pools", description: "Worker node groups" },
      { id: "autoscaling", label: "Auto-scaling", description: "Horizontal pod autoscaler" },
    ],
  },
  database: {
    label: "Database",
    icon: Database,
    options: [
      {
        id: "relational_db",
        label: "Relational Database",
        description: "RDS / Cloud SQL / Azure SQL",
      },
      { id: "redis", label: "Redis Cache", description: "ElastiCache / Memorystore / Azure Cache" },
      { id: "backup", label: "Automated Backups", description: "Point-in-time recovery" },
    ],
  },
  monitoring: {
    label: "Monitoring",
    icon: FileCode,
    options: [
      {
        id: "logging",
        label: "Centralized Logging",
        description: "CloudWatch / Cloud Logging / Log Analytics",
      },
      { id: "metrics", label: "Metrics & Monitoring", description: "Prometheus, Grafana" },
      { id: "alerts", label: "Alerting", description: "SNS / Pub/Sub / Action Groups" },
    ],
  },
};

export default function CodeGenerationDialog({ open, onClose, architecture, services }) {
  const [cloudProvider, setCloudProvider] = useState("aws");
  const [selectedComponents, setSelectedComponents] = useState({
    vpc: true,
    kubernetes: true,
    relational_db: true,
    security_groups: true,
    node_pools: true,
    logging: true,
  });
  const [region, setRegion] = useState("us-east-1");
  const [environment, setEnvironment] = useState("production");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [copied, setCopied] = useState({});

  const regions = {
    aws: ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"],
    gcp: ["us-central1", "us-east1", "europe-west1", "asia-southeast1"],
    azure: ["eastus", "westus2", "westeurope", "southeastasia"],
  };

  const handleComponentToggle = (componentId) => {
    setSelectedComponents((prev) => ({
      ...prev,
      [componentId]: !prev[componentId],
    }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.functions.invoke("generateTerraform", {
        architecture_id: architecture.id,
        architecture_name: architecture.name,
        services: services,
        cloud_provider: cloudProvider,
        region: region,
        environment: environment,
        components: selectedComponents,
      });

      setGeneratedCode(response.data);
      toast.success("Infrastructure code generated successfully!");
    } catch (error) {
      toast.error("Failed to generate code: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (fileName, content) => {
    navigator.clipboard.writeText(content);
    setCopied({ [fileName]: true });
    toast.success(`Copied ${fileName} to clipboard`);
    setTimeout(() => setCopied({}), 2000);
  };

  const handleDownloadAll = () => {
    if (!generatedCode) return;

    Object.entries(generatedCode.files).forEach(([fileName, content]) => {
      const blob = new Blob([content], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    });

    toast.success("All files downloaded");
  };

  return (
    <Dialog data-b44-sync="true" open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Generate Infrastructure Code
          </DialogTitle>
          <DialogDescription>
            Generate Terraform configurations for deploying {architecture?.name}
          </DialogDescription>
        </DialogHeader>

        {!generatedCode ? (
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="provider" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="provider">Cloud Provider</TabsTrigger>
                <TabsTrigger value="components">Infrastructure</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="provider" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {cloudProviders.map((provider) => (
                    <Card
                      key={provider.id}
                      className={`cursor-pointer transition-all ${
                        cloudProvider === provider.id
                          ? "border-2 border-slate-900 shadow-md"
                          : "border-2 border-transparent hover:border-slate-300"
                      }`}
                      onClick={() => setCloudProvider(provider.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center gap-3">
                          <div
                            className={`w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center`}
                          >
                            <provider.icon className={`w-8 h-8 ${provider.color}`} />
                          </div>
                          <h3 className="font-semibold">{provider.name}</h3>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Code className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">Terraform Configuration</p>
                        <p className="text-sm text-blue-700 mt-1">
                          We'll generate production-ready Terraform code with modules, variables,
                          and outputs. Includes best practices for security, networking, and
                          scalability.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="components" className="space-y-4 mt-4">
                {Object.entries(infrastructureComponents).map(([key, category]) => (
                  <Card key={key}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <category.icon className="w-5 h-5" />
                        {category.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {category.options.map((option) => (
                        <div
                          key={option.id}
                          className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Checkbox
                            id={option.id}
                            checked={selectedComponents[option.id] || false}
                            onCheckedChange={() => handleComponentToggle(option.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={option.id}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {option.label}
                            </label>
                            <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Deployment Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="region">Region</Label>
                      <Select value={region} onValueChange={setRegion}>
                        <SelectTrigger id="region">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(regions[cloudProvider] || []).map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="environment">Environment</Label>
                      <Select value={environment} onValueChange={setEnvironment}>
                        <SelectTrigger id="environment">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="development">Development</SelectItem>
                          <SelectItem value="staging">Staging</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-50">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">Generation Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Cloud Provider:</span>
                        <span className="font-medium">
                          {cloudProviders.find((p) => p.id === cloudProvider)?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Region:</span>
                        <span className="font-medium">{region}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Environment:</span>
                        <span className="font-medium capitalize">{environment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Services:</span>
                        <span className="font-medium">{services?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Components:</span>
                        <span className="font-medium">
                          {Object.values(selectedComponents).filter(Boolean).length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-slate-900 hover:bg-slate-800"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Code className="w-4 h-4 mr-2" />
                    Generate Code
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">Code Generated Successfully</p>
                  <p className="text-sm text-slate-500">
                    {Object.keys(generatedCode.files).length} files ready to download
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDownloadAll}>
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </Button>
                <Button variant="outline" onClick={() => setGeneratedCode(null)}>
                  Generate Again
                </Button>
              </div>
            </div>

            <Tabs
              defaultValue={Object.keys(generatedCode.files)[0]}
              className="flex-1 flex flex-col min-h-0"
            >
              <TabsList className="grid w-full grid-cols-4">
                {Object.keys(generatedCode.files)
                  .slice(0, 4)
                  .map((fileName) => (
                    <TabsTrigger key={fileName} value={fileName} className="text-xs">
                      {fileName}
                    </TabsTrigger>
                  ))}
              </TabsList>

              {Object.entries(generatedCode.files).map(([fileName, content]) => (
                <TabsContent key={fileName} value={fileName} className="flex-1 mt-4 min-h-0">
                  <Card className="h-full flex flex-col">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-mono">{fileName}</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(fileName, content)}
                      >
                        {copied[fileName] ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 min-h-0">
                      <ScrollArea className="h-[400px] w-full rounded-md border">
                        <pre className="p-4 text-xs font-mono">
                          <code>{content}</code>
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
