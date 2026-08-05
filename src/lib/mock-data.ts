export type ComplaintStatus = "Open" | "In Progress" | "Resolved" | "Escalated";
export type Priority = "Low" | "Medium" | "High" | "Critical";

export type Complaint = {
  id: string;
  title: string;
  category: string;
  flat: string;
  raisedBy: string;
  status: ComplaintStatus;
  priority: Priority;
  updated: string;
};

export const complaints: Complaint[] = [
  { id: "CMP-2041", title: "Lift stuck between floors 6 and 7", category: "Elevator", flat: "B-704", raisedBy: "Ananya Rao", status: "Escalated", priority: "Critical", updated: "12 min ago" },
  { id: "CMP-2039", title: "Water seepage in bedroom ceiling", category: "Plumbing", flat: "A-302", raisedBy: "Rahul Menon", status: "In Progress", priority: "High", updated: "1 hr ago" },
  { id: "CMP-2036", title: "Corridor lights not working", category: "Electrical", flat: "C-105", raisedBy: "Sneha Kulkarni", status: "Open", priority: "Medium", updated: "3 hrs ago" },
  { id: "CMP-2031", title: "Garbage not collected since Monday", category: "Housekeeping", flat: "D-902", raisedBy: "Imran Sheikh", status: "In Progress", priority: "Medium", updated: "5 hrs ago" },
  { id: "CMP-2028", title: "Unauthorised parking in slot 44", category: "Parking", flat: "A-1101", raisedBy: "Meera Iyer", status: "Resolved", priority: "Low", updated: "Yesterday" },
  { id: "CMP-2024", title: "Gym treadmill making loud noise", category: "Amenities", flat: "B-208", raisedBy: "Karan Bhatia", status: "Open", priority: "Low", updated: "Yesterday" },
  { id: "CMP-2019", title: "Intercom not connecting to gate", category: "Security", flat: "C-601", raisedBy: "Divya Nair", status: "Resolved", priority: "High", updated: "2 days ago" },
  { id: "CMP-2015", title: "Swimming pool water is cloudy", category: "Amenities", flat: "D-404", raisedBy: "Aditya Ghosh", status: "In Progress", priority: "Medium", updated: "3 days ago" },
  { id: "CMP-2011", title: "Fire extinguisher expired on 5th floor", category: "Safety", flat: "B-509", raisedBy: "Priya Desai", status: "Escalated", priority: "Critical", updated: "3 days ago" },
  { id: "CMP-2007", title: "Damaged tiles near clubhouse entry", category: "Civil", flat: "A-806", raisedBy: "Nikhil Verma", status: "Resolved", priority: "Low", updated: "4 days ago" },
  { id: "CMP-2003", title: "Pest control required in kitchen", category: "Housekeeping", flat: "C-207", raisedBy: "Fatima Khan", status: "Open", priority: "Medium", updated: "5 days ago" },
  { id: "CMP-1998", title: "Visitor parking barrier malfunction", category: "Security", flat: "D-101", raisedBy: "Sanjay Pillai", status: "Resolved", priority: "High", updated: "6 days ago" },
];

export const complaintTrend = [
  { month: "Feb", raised: 42, resolved: 36 },
  { month: "Mar", raised: 51, resolved: 47 },
  { month: "Apr", raised: 38, resolved: 40 },
  { month: "May", raised: 60, resolved: 52 },
  { month: "Jun", raised: 47, resolved: 49 },
  { month: "Jul", raised: 55, resolved: 58 },
];

export const collectionTrend = [
  { month: "Feb", collected: 1820000, dues: 240000 },
  { month: "Mar", collected: 1910000, dues: 195000 },
  { month: "Apr", collected: 1760000, dues: 310000 },
  { month: "May", collected: 2040000, dues: 165000 },
  { month: "Jun", collected: 1980000, dues: 210000 },
  { month: "Jul", collected: 2185000, dues: 132000 },
];

export const categorySplit = [
  { name: "Plumbing", value: 28 },
  { name: "Electrical", value: 22 },
  { name: "Housekeeping", value: 18 },
  { name: "Security", value: 16 },
  { name: "Amenities", value: 16 },
];

export const visitorFlow = [
  { hour: "06", visitors: 8 },
  { hour: "09", visitors: 34 },
  { hour: "12", visitors: 27 },
  { hour: "15", visitors: 41 },
  { hour: "18", visitors: 63 },
  { hour: "21", visitors: 22 },
];

export const sparkline = [
  { v: 12 }, { v: 18 }, { v: 15 }, { v: 24 }, { v: 21 }, { v: 30 }, { v: 27 }, { v: 36 },
];

export type Activity = {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: "primary" | "success" | "warning" | "danger" | "info";
};

export const activityFeed: Activity[] = [
  { id: "1", title: "Visitor checked in", detail: "Swiggy delivery • Gate 2 • Flat B-704", time: "Just now", tone: "info" },
  { id: "2", title: "Complaint escalated", detail: "CMP-2041 elevator fault escalated to vendor", time: "12 min ago", tone: "danger" },
  { id: "3", title: "Maintenance received", detail: "₹4,800 from Flat A-302 for July cycle", time: "38 min ago", tone: "success" },
  { id: "4", title: "New announcement", detail: "Water tank cleaning scheduled for Sunday", time: "2 hrs ago", tone: "primary" },
  { id: "5", title: "Staff assigned", detail: "Ramesh (Plumber) assigned to CMP-2039", time: "3 hrs ago", tone: "warning" },
];

export type Visitor = {
  id: string;
  name: string;
  purpose: string;
  flat: string;
  entry: string;
  exit: string | null;
  status: "Inside" | "Exited" | "Awaiting approval";
};

export const visitors: Visitor[] = [
  { id: "VIS-881", name: "Amit Shukla", purpose: "Guest", flat: "A-302", entry: "18:42", exit: null, status: "Inside" },
  { id: "VIS-880", name: "Blinkit Delivery", purpose: "Delivery", flat: "B-704", entry: "18:31", exit: "18:39", status: "Exited" },
  { id: "VIS-879", name: "Sunita Rane", purpose: "Domestic help", flat: "C-105", entry: "17:58", exit: null, status: "Inside" },
  { id: "VIS-878", name: "Vodafone Technician", purpose: "Service", flat: "D-902", entry: "17:20", exit: "18:05", status: "Exited" },
  { id: "VIS-877", name: "Rohit Malhotra", purpose: "Guest", flat: "A-1101", entry: "—", exit: null, status: "Awaiting approval" },
];
