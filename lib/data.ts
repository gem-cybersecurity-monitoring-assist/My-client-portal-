export type TeamMember = {
  id: string
  name: string
  team: "GEM" | "Alliance"
  role: string
  status: "Active" | "Inactive"
  clearance: string
}

export type Tenant = {
  id: string
  name: string
  status: "Healthy" | "Warning" | "Critical"
  users: number
  revenue: string
}

export type Portfolio = {
  id: string
  client: string
  value: string
  change: string
  status: "Active" | "Inactive"
}

export type LogEntry = {
  time: string
  user: string
  action: string
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR"
}

export type UserRole = "superadmin" | "admin" | "team" | "client"

export type User = {
  email: string
  password: string
  role: UserRole
  name: string
}

export const USERS: Record<string, User> = {
  "superadmin@gem.com": { email: "superadmin@gem.com", password: "super123", role: "superadmin", name: "Super Admin" },
  "admin@gem.com": { email: "admin@gem.com", password: "admin123", role: "admin", name: "Organization Admin" },
  "team@gem.com": { email: "team@gem.com", password: "team123", role: "team", name: "Team Member" },
  "client@gem.com": { email: "client@gem.com", password: "client123", role: "client", name: "Platform Client" },
}

export const teams: TeamMember[] = [
  { id: "GEM-001", name: "John Doe", team: "GEM", role: "Cybersecurity Director", status: "Active", clearance: "L4" },
  { id: "GEM-002", name: "Victor Chinemelomu", team: "GEM", role: "Chief Compliance & Intelligence Officer", status: "Active", clearance: "L5" },
  { id: "GEM-003", name: "Sophia Martinez", team: "GEM", role: "Director of Financial Recovery Operations", status: "Active", clearance: "L3" },
  { id: "GEM-004", name: "Eric Lin", team: "GEM", role: "AI Systems Architect", status: "Active", clearance: "L4" },
  { id: "GEM-005", name: "James Carter", team: "GEM", role: "Threat Intelligence Analyst", status: "Active", clearance: "L2" },
  { id: "GEM-006", name: "Rachel Adams", team: "GEM", role: "Digital Forensics Analyst", status: "Active", clearance: "L2" },
  { id: "GEM-007", name: "Michael Brown", team: "GEM", role: "Network Defense Engineer", status: "Active", clearance: "L2" },
  { id: "GEM-008", name: "Olivia Chen", team: "GEM", role: "Cryptography Specialist", status: "Active", clearance: "L3" },
  { id: "GEM-009", name: "Daniel White", team: "GEM", role: "Incident Response Lead", status: "Active", clearance: "L3" },
  { id: "GEM-010", name: "Laura Green", team: "GEM", role: "Fraud Detection Analyst", status: "Active", clearance: "L2" },
  { id: "ATR-001", name: "Jane Smith", team: "Alliance", role: "Real Estate Consultant", status: "Active", clearance: "RE-LIC" },
  { id: "ATR-002", name: "Angela Robinson", team: "Alliance", role: "Legal & Regulatory Liaison Officer", status: "Active", clearance: "BAR-221" },
  { id: "ATR-003", name: "Mark Thompson", team: "Alliance", role: "Investment Manager", status: "Active", clearance: "FIN-LIC" },
  { id: "ATR-004", name: "Susan Wright", team: "Alliance", role: "Property Manager", status: "Active", clearance: "PM-LIC" },
  { id: "ATR-005", name: "Kevin Lee", team: "Alliance", role: "Asset Manager", status: "Active", clearance: "FIN-LIC" },
  { id: "ATR-006", name: "Emily Johnson", team: "Alliance", role: "Recovery Specialist", status: "Active", clearance: "OPS" },
  { id: "ATR-007", name: "Robert King", team: "Alliance", role: "Client Portfolio Advisor", status: "Active", clearance: "FIN-LIC" },
  { id: "ATR-008", name: "Natalie Perez", team: "Alliance", role: "Financial Operations Manager", status: "Active", clearance: "FIN" },
  { id: "ATR-009", name: "Thomas Scott", team: "Alliance", role: "Contract Administrator", status: "Active", clearance: "OPS" },
  { id: "ATR-010", name: "Maria Torres", team: "Alliance", role: "Compliance & Regulatory Liaison", status: "Active", clearance: "BAR-445" },
]

export const tenants: Tenant[] = [
  { id: "T-001", name: "Global Tech Corp", status: "Healthy", users: 124, revenue: "$1.2M" },
  { id: "T-002", name: "Nexus Financial", status: "Healthy", users: 89, revenue: "$850K" },
  { id: "T-003", name: "Cyberdyne Systems", status: "Warning", users: 45, revenue: "$320K" },
  { id: "T-004", name: "Wayne Enterprises", status: "Healthy", users: 210, revenue: "$2.4M" },
]

export const portfolios: Portfolio[] = [
  { id: "P-001", client: "John Doe", value: "$124,500", change: "+5.2%", status: "Active" },
  { id: "P-002", client: "Alice Smith", value: "$89,200", change: "-1.4%", status: "Active" },
  { id: "P-003", client: "Bob Johnson", value: "$450,000", change: "+12.8%", status: "Active" },
]

export const logs: LogEntry[] = [
  { time: "2026-02-07 10:15:22", user: "superadmin@gem.com", action: 'Tenant "Global Tech Corp" updated', type: "INFO" },
  { time: "2026-02-07 10:12:05", user: "admin@gem.com", action: 'New user "sarah.j" added', type: "SUCCESS" },
  { time: "2026-02-07 10:10:45", user: "system", action: "Automated backup completed", type: "INFO" },
  { time: "2026-02-07 10:05:12", user: "client@gem.com", action: "Failed login attempt", type: "WARNING" },
]

export const transactions = [
  { id: 1, label: "Buy GEM Digital Asset", amount: "-$5,000.00", positive: false, date: "2026-02-07 09:30" },
  { id: 2, label: "Deposit via Bank Transfer", amount: "+$10,000.00", positive: true, date: "2026-02-06 14:20" },
  { id: 3, label: "Sell ATR Real Estate Token", amount: "+$2,340.50", positive: true, date: "2026-02-05 11:15" },
]

export const aiAgents = [
  { name: "Market Analyst", description: "Real-time sentiment analysis and trend prediction for digital assets.", metric: "CPU Usage", value: 12, color: "primary" as const },
  { name: "Fraud Sentry", description: "Anomaly detection in transaction patterns and identity verification.", metric: "Memory", value: 45, color: "secondary" as const },
  { name: "Client Concierge", description: "Natural language processing for client inquiries and automated support.", metric: "Latency", value: 30, color: "warning" as const },
]

export const aiLogs = [
  { time: "10:45:01", agent: "MarketAnalyst", action: "Processed 12,000 data points...", color: "primary" as const },
  { time: "10:44:58", agent: "FraudSentry", action: "Validating transaction TX-992... OK", color: "secondary" as const },
  { time: "10:44:55", agent: "ClientConcierge", action: "Responding to inquiry #8831...", color: "warning" as const },
  { time: "10:44:50", agent: "MarketAnalyst", action: "Adjusting risk parameters...", color: "primary" as const },
]
