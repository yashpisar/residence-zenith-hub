import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {
  Society,
  User,
  SocietyMembership,
  Flat,
  Complaint,
  MaintenanceBill,
  Payment,
  Visitor,
  Notice,
  Document,
  Staff,
  Delivery,
  EmergencyAlert,
  Notification,
} from "../models/index.js";

export async function runSeed() {
  // Password hash for 'password123'
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("password123", salt);

  // 1. Clear existing data safely
  await Promise.all([
    Society.deleteMany({}),
    User.deleteMany({}),
    SocietyMembership.deleteMany({}),
    Flat.deleteMany({}),
    Complaint.deleteMany({}),
    MaintenanceBill.deleteMany({}),
    Payment.deleteMany({}),
    Visitor.deleteMany({}),
    Notice.deleteMany({}),
    Document.deleteMany({}),
    Staff.deleteMany({}),
    Delivery.deleteMany({}),
    EmergencyAlert.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  console.log("[Seed] Existing collections cleared.");

  // 2. Create Societies
  const harmony = await Society.create({
    name: "Harmony Heights",
    slug: "harmony-heights",
    registrationNumber: "SOC-PUN-001",
    type: "Apartment",
    address: "412 Link Road, Wakad",
    city: "Pune",
    state: "Maharashtra",
    pinCode: "411057",
    secretaryName: "Rahul Patil",
    secretaryMobile: "9876543210",
    secretaryEmail: "rahul.patil@harmony.com",
    officeTiming: "10:00 AM - 6:00 PM",
    emergencyContact: "1800-111-2222",
    coverImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=600",
    logo: "https://ui-avatars.com/api/?name=Harmony+Heights&background=14B8A6&color=fff&rounded=true&size=128",
    wings: [
      { id: "w1", name: "A", totalFlats: 100 },
      { id: "w2", name: "B", totalFlats: 100 },
      { id: "w3", name: "C", totalFlats: 50 },
    ],
    totalFlats: 250,
    totalResidents: 520,
    occupiedFlats: 220,
    vacantFlats: 30,
    amenities: ["Gym", "Garden", "Swimming Pool", "Club House", "Parking", "Children Play Area"],
    status: "Active",
    description: "Premium living community in the heart of Pune.",
  });

  const greenValley = await Society.create({
    name: "Green Valley Residency",
    slug: "green-valley-residency",
    registrationNumber: "SOC-MUM-002",
    type: "Residential Complex",
    address: "Cyber City, Andheri East",
    city: "Mumbai",
    state: "Maharashtra",
    pinCode: "400053",
    secretaryName: "Priya Sharma",
    secretaryMobile: "9988776655",
    secretaryEmail: "priya.sharma@greenvalley.com",
    officeTiming: "9:00 AM - 5:00 PM",
    emergencyContact: "1800-333-4444",
    coverImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600",
    logo: "https://ui-avatars.com/api/?name=Green+Valley+Residency&background=3B82F6&color=fff&rounded=true&size=128",
    wings: [
      { id: "w1", name: "A", totalFlats: 90 },
      { id: "w2", name: "B", totalFlats: 90 },
    ],
    totalFlats: 180,
    totalResidents: 390,
    occupiedFlats: 150,
    vacantFlats: 30,
    amenities: ["Garden", "Parking", "Gym", "Children Play Area"],
    status: "Active",
    description: "Serene living spaces offering tranquility in Mumbai.",
  });

  console.log("[Seed] Societies created.");

  // 3. Create Flats for Harmony Heights
  const flatA402 = await Flat.create({
    societyId: harmony._id,
    wing: "A",
    flatNumber: "A-402",
    floor: 4,
    occupancyStatus: "Occupied",
    ownerName: "Ananya Rao",
    ownerPhone: "9820011223",
    ownerEmail: "demo@resident.com",
    totalResidents: 3,
    intercomNumber: "1402",
  });

  const flatB704 = await Flat.create({
    societyId: harmony._id,
    wing: "B",
    flatNumber: "B-704",
    floor: 7,
    occupancyStatus: "Occupied",
    ownerName: "Vikram Malhotra",
    ownerPhone: "9820044556",
    ownerEmail: "vikram@malhotra.com",
    totalResidents: 2,
    intercomNumber: "2704",
  });

  const flatC105 = await Flat.create({
    societyId: harmony._id,
    wing: "C",
    flatNumber: "C-105",
    floor: 1,
    occupancyStatus: "Occupied",
    ownerName: "Sneha Kulkarni",
    ownerPhone: "9820077889",
    ownerEmail: "sneha@kulkarni.com",
    totalResidents: 4,
    intercomNumber: "3105",
  });

  const flatA101 = await Flat.create({
    societyId: harmony._id,
    wing: "A",
    flatNumber: "A-101",
    floor: 1,
    occupancyStatus: "Vacant",
    totalResidents: 0,
    intercomNumber: "1101",
  });

  // 4. Create Users (Resident, Secretary, Security Guard, Superadmin)
  const residentUser = await User.create({
    name: "Ananya Rao",
    email: "demo@resident.com",
    phone: "9820011223",
    passwordHash,
    role: "resident",
    status: "Active",
    societyId: harmony._id,
    flatId: flatA402._id,
    wing: "A",
    flatNumber: "A-402",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
  });

  const residentUserHarmony = await User.create({
    name: "Vikram Malhotra",
    email: "resident@harmony.com",
    phone: "9820044556",
    passwordHash,
    role: "resident",
    status: "Active",
    societyId: harmony._id,
    flatId: flatB704._id,
    wing: "B",
    flatNumber: "B-704",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
  });

  const secretaryUser = await User.create({
    name: "Rahul Patil",
    email: "demo@secretary.com",
    phone: "9876543210",
    passwordHash,
    role: "secretary",
    status: "Active",
    societyId: harmony._id,
    wing: "B",
    flatNumber: "B-101",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150",
  });

  const secretaryUserHarmony = await User.create({
    name: "Rahul Patil",
    email: "secretary@harmony.com",
    phone: "9876543211",
    passwordHash,
    role: "secretary",
    status: "Active",
    societyId: harmony._id,
    wing: "B",
    flatNumber: "B-101",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150",
  });

  const guardUser = await User.create({
    name: "Amit Sharma",
    email: "demo@security.com",
    phone: "9811223344",
    passwordHash,
    role: "security",
    status: "Active",
    societyId: harmony._id,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
  });

  const guardUserHarmony = await User.create({
    name: "Amit Sharma",
    email: "guard@harmony.com",
    phone: "9811223345",
    passwordHash,
    role: "security",
    status: "Active",
    societyId: harmony._id,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
  });

  const adminUser = await User.create({
    name: "System Superadmin",
    email: "admin@harmony.com",
    phone: "9900112233",
    passwordHash,
    role: "superadmin",
    status: "Active",
  });

  // Link flatA402 and flatB704 to residents
  flatA402.ownerId = residentUser._id;
  flatA402.residentIds = [residentUser._id];
  await flatA402.save();

  flatB704.ownerId = residentUserHarmony._id;
  flatB704.residentIds = [residentUserHarmony._id];
  await flatB704.save();

  // Create Flats for Green Valley Residency
  const flatGVA101 = await Flat.create({
    societyId: greenValley._id,
    wing: "A",
    flatNumber: "A-101",
    floor: 1,
    occupancyStatus: "Occupied",
    ownerName: "Ananya Rao",
    ownerPhone: "9820011223",
    ownerEmail: "demo@resident.com",
    totalResidents: 3,
    intercomNumber: "1101",
    ownerId: residentUser._id,
    residentIds: [residentUser._id],
  });

  const flatGVB201 = await Flat.create({
    societyId: greenValley._id,
    wing: "B",
    flatNumber: "B-201",
    floor: 2,
    occupancyStatus: "Occupied",
    ownerName: "Vikram Malhotra",
    ownerPhone: "9820044556",
    ownerEmail: "resident@harmony.com",
    totalResidents: 2,
    intercomNumber: "2201",
    ownerId: residentUserHarmony._id,
    residentIds: [residentUserHarmony._id],
  });

  // 5. Create SocietyMemberships for BOTH Societies
  await SocietyMembership.create([
    // Harmony Heights memberships
    {
      userId: residentUser._id,
      societyId: harmony._id,
      role: "resident",
      flatId: flatA402._id,
      wing: "A",
      flatNumber: "A-402",
      isOwner: true,
      isDefault: true,
    },
    {
      userId: residentUserHarmony._id,
      societyId: harmony._id,
      role: "resident",
      flatId: flatB704._id,
      wing: "B",
      flatNumber: "B-704",
      isOwner: true,
      isDefault: true,
    },
    {
      userId: secretaryUser._id,
      societyId: harmony._id,
      role: "secretary",
      isDefault: true,
    },
    {
      userId: secretaryUserHarmony._id,
      societyId: harmony._id,
      role: "secretary",
      isDefault: true,
    },
    {
      userId: guardUser._id,
      societyId: harmony._id,
      role: "security",
      isDefault: true,
    },
    {
      userId: guardUserHarmony._id,
      societyId: harmony._id,
      role: "security",
      isDefault: true,
    },
    {
      userId: adminUser._id,
      societyId: harmony._id,
      role: "superadmin",
      isDefault: true,
    },
    // Green Valley Residency memberships
    {
      userId: residentUser._id,
      societyId: greenValley._id,
      role: "resident",
      flatId: flatGVA101._id,
      wing: "A",
      flatNumber: "A-101",
      isOwner: true,
      isDefault: false,
    },
    {
      userId: residentUserHarmony._id,
      societyId: greenValley._id,
      role: "resident",
      flatId: flatGVB201._id,
      wing: "B",
      flatNumber: "B-201",
      isOwner: true,
      isDefault: false,
    },
    {
      userId: secretaryUser._id,
      societyId: greenValley._id,
      role: "secretary",
      isDefault: false,
    },
    {
      userId: secretaryUserHarmony._id,
      societyId: greenValley._id,
      role: "secretary",
      isDefault: false,
    },
    {
      userId: guardUser._id,
      societyId: greenValley._id,
      role: "security",
      isDefault: false,
    },
    {
      userId: guardUserHarmony._id,
      societyId: greenValley._id,
      role: "security",
      isDefault: false,
    },
    {
      userId: adminUser._id,
      societyId: greenValley._id,
      role: "superadmin",
      isDefault: false,
    },
  ]);

  console.log("[Seed] Users & Memberships created.");

  // 6. Create Complaints
  await Complaint.create([
    {
      societyId: harmony._id,
      complaintNumber: "CMP-2026-001",
      createdBy: residentUser._id,
      flatId: flatA402._id,
      wing: "A",
      flatNumber: "A-402",
      title: "Water seepage in bedroom ceiling",
      description: "Severe water leakage observed around the AC duct during rain.",
      category: "Plumbing",
      priority: "High",
      isUrgent: false,
      visibility: "private",
      status: "In Progress",
      assignedStaff: {
        name: "Ramesh Pawar",
        phone: "9823001122",
        role: "Plumber",
      },
      statusHistory: [
        { status: "Pending", changedBy: residentUser._id, notes: "Complaint registered" },
        { status: "In Progress", changedBy: secretaryUser._id, notes: "Assigned to Ramesh (Plumber)" },
      ],
    },
    {
      societyId: harmony._id,
      complaintNumber: "CMP-2026-002",
      createdBy: residentUser._id,
      flatId: flatA402._id,
      wing: "B",
      flatNumber: "B-704",
      title: "Lift stuck between floors 6 and 7",
      description: "Wing B passenger lift stopped abruptly with passengers inside.",
      category: "Elevator",
      priority: "Critical",
      isUrgent: true,
      visibility: "public",
      status: "Pending",
      upvotes: [residentUser._id],
      statusHistory: [{ status: "Pending", changedBy: residentUser._id, notes: "Critical SOS reported" }],
    },
    {
      societyId: harmony._id,
      complaintNumber: "CMP-2026-003",
      createdBy: residentUser._id,
      flatId: flatC105._id,
      wing: "C",
      flatNumber: "C-105",
      title: "Corridor lights not working",
      description: "Floor 1 corridor lights are flickering and causing total darkness at night.",
      category: "Electrical",
      priority: "Medium",
      isUrgent: false,
      visibility: "public",
      status: "Resolved",
      upvotes: [residentUser._id, secretaryUser._id],
      statusHistory: [
        { status: "Pending", changedBy: residentUser._id, notes: "Complaint registered" },
        { status: "In Progress", changedBy: secretaryUser._id, notes: "Electrician assigned" },
        { status: "Resolved", changedBy: secretaryUser._id, notes: "Ballast replaced and tested" },
      ],
    },
    {
      societyId: greenValley._id,
      complaintNumber: "CMP-2026-101",
      createdBy: residentUser._id,
      flatId: flatGVA101._id,
      wing: "A",
      flatNumber: "A-101",
      title: "Water leakage in bathroom",
      description: "Severe water leakage detected around the main tap fixture.",
      category: "Plumbing",
      priority: "High",
      isUrgent: false,
      visibility: "private",
      status: "In Progress",
      assignedStaff: {
        name: "Rajesh (Plumber)",
        phone: "9823004455",
        role: "Plumber",
      },
      statusHistory: [
        { status: "Pending", changedBy: residentUser._id, notes: "Complaint registered" },
        { status: "In Progress", changedBy: secretaryUser._id, notes: "Assigned to Rajesh (Plumber)" },
      ],
    },
    {
      societyId: greenValley._id,
      complaintNumber: "CMP-2026-102",
      createdBy: residentUserHarmony._id,
      flatId: flatGVB201._id,
      wing: "B",
      flatNumber: "B-201",
      title: "Main gate intercom connection lost",
      description: "Unable to receive gate buzzers or talk to security desk.",
      category: "Electrical",
      priority: "Medium",
      isUrgent: false,
      visibility: "public",
      status: "Pending",
      statusHistory: [{ status: "Pending", changedBy: residentUserHarmony._id, notes: "Reported by resident" }],
    },
  ]);

  // 7. Create Maintenance Bills & Payments
  const octBill = await MaintenanceBill.create({
    societyId: harmony._id,
    flatId: flatA402._id,
    residentId: residentUser._id,
    wing: "A",
    flatNumber: "A-402",
    billingPeriod: "2026-10",
    dueDate: new Date("2026-10-25"),
    baseAmount: 3500,
    breakdown: [
      { label: "Base Maintenance", amount: 3500 },
      { label: "Sinking Fund", amount: 500 },
      { label: "Clubhouse Fee", amount: 500 },
    ],
    totalAmount: 4500,
    paidAmount: 0,
    outstandingBalance: 4500,
    status: "Unpaid",
    createdBy: secretaryUser._id,
  });

  const sepBill = await MaintenanceBill.create({
    societyId: harmony._id,
    flatId: flatA402._id,
    residentId: residentUser._id,
    wing: "A",
    flatNumber: "A-402",
    billingPeriod: "2026-09",
    dueDate: new Date("2026-09-25"),
    baseAmount: 3500,
    breakdown: [
      { label: "Base Maintenance", amount: 3500 },
      { label: "Sinking Fund", amount: 500 },
      { label: "Clubhouse Fee", amount: 500 },
    ],
    totalAmount: 4500,
    paidAmount: 4500,
    outstandingBalance: 0,
    status: "Paid",
    createdBy: secretaryUser._id,
  });

  await Payment.create({
    societyId: harmony._id,
    flatId: flatA402._id,
    billId: sepBill._id,
    payerId: residentUser._id,
    amount: 4500,
    paymentMethod: "UPI",
    provider: "Demo",
    providerOrderId: "order_demo_sep_402",
    providerTransactionId: "txn_demo_sep_402_99182",
    receiptNumber: "RCP-2026-09-001",
    status: "Successful",
    idempotencyKey: "idem_sep_402_pay",
    verifiedAt: new Date("2026-09-04"),
    notes: "Verified monthly maintenance payment",
  });

  // 8. Create Visitors
  await Visitor.create([
    {
      societyId: harmony._id,
      flatId: flatA402._id,
      wing: "A",
      flatNumber: "A-402",
      visitorName: "Rajesh Kulkarni",
      phone: "9820099881",
      purpose: "Guest",
      vehicleNumber: "MH 12 AB 1234",
      entryTime: new Date(Date.now() - 45 * 60 * 1000), // 45 mins ago
      registeredBy: "guard",
      guardId: guardUser._id,
      approvalStatus: "Approved",
      approvedBy: residentUser._id,
      passToken: "tok_guest_402_1",
    },
    {
      societyId: harmony._id,
      flatId: flatA402._id,
      wing: "A",
      flatNumber: "A-402",
      visitorName: "Sunil Delivery (Amazon)",
      phone: "9820099882",
      purpose: "Delivery",
      vehicleNumber: "MH 14 CD 5678",
      registeredBy: "guard",
      guardId: guardUser._id,
      approvalStatus: "Pending",
      passToken: "tok_deliv_402_2",
    },
    {
      societyId: harmony._id,
      flatId: flatB704._id,
      wing: "B",
      flatNumber: "B-704",
      visitorName: "Vikram Electrician",
      phone: "9820099883",
      purpose: "Service",
      registeredBy: "guard",
      guardId: guardUser._id,
      approvalStatus: "Approved",
      entryTime: new Date(Date.now() - 3 * 3600 * 1000),
      exitTime: new Date(Date.now() - 1 * 3600 * 1000),
    },
  ]);

  // 9. Create Notices
  await Notice.create([
    {
      societyId: harmony._id,
      title: "Annual General Body Meeting (AGM) 2026",
      description: "The AGM will be held on Sunday, 25th October at 10:30 AM in the Clubhouse. Attendance is mandatory for all flat owners.",
      category: "Meeting",
      priority: "High",
      postedBy: secretaryUser._id,
      authorName: "Rahul Patil",
      targetAudience: "all",
      status: "Published",
      publishedAt: new Date(Date.now() - 24 * 3600 * 1000),
    },
    {
      societyId: harmony._id,
      title: "Scheduled Water Tank Cleaning",
      description: "Water supply will be suspended between 1:00 PM and 5:00 PM on Wednesday for overhead tank cleaning and chlorination.",
      category: "Maintenance",
      priority: "Medium",
      postedBy: secretaryUser._id,
      authorName: "Rahul Patil",
      targetAudience: "residents",
      status: "Published",
      publishedAt: new Date(Date.now() - 48 * 3600 * 1000),
    },
  ]);

  // 10. Create Documents
  await Document.create([
    {
      societyId: harmony._id,
      title: "Society Bye-Laws & Code of Conduct",
      category: "Society Rules",
      fileUrl: "/api/v1/files/sample-rules.pdf",
      fileType: "application/pdf",
      fileSize: 1048576,
      uploadedBy: secretaryUser._id,
      uploaderName: "Rahul Patil",
      accessLevel: "public_to_society",
      description: "Official society rules, noise regulations, and parking policies.",
    },
    {
      societyId: harmony._id,
      title: "Annual Financial Audit Report 2025-2026",
      category: "Financial Documents",
      fileUrl: "/api/v1/files/audit-report.pdf",
      fileType: "application/pdf",
      fileSize: 2097152,
      uploadedBy: secretaryUser._id,
      uploaderName: "Rahul Patil",
      accessLevel: "public_to_society",
      description: "Audited balance sheet and income/expenditure accounts.",
    },
  ]);

  // 11. Create Staff
  await Staff.create([
    {
      societyId: harmony._id,
      name: "Amit Sharma",
      phone: "9811223344",
      email: "demo@security.com",
      role: "Security Guard",
      shift: "Morning",
      status: "On Duty",
      assignedWing: "Main Gate",
    },
    {
      societyId: harmony._id,
      name: "Ramesh Pawar",
      phone: "9823001122",
      role: "Plumber",
      shift: "General",
      status: "On Duty",
      assignedWing: "All",
    },
    {
      societyId: harmony._id,
      name: "Sunita Devi",
      phone: "9823004455",
      role: "Housekeeping",
      shift: "Morning",
      status: "On Duty",
      assignedWing: "Wing A",
    },
    {
      societyId: greenValley._id,
      name: "Rajesh Shinde",
      phone: "9822005511",
      email: "rajesh.plumber@greenvalley.com",
      role: "Plumber",
      shift: "General",
      status: "On Duty",
      assignedWing: "All",
    },
    {
      societyId: greenValley._id,
      name: "Mahesh Jadhav",
      phone: "9822005522",
      role: "Electrician",
      shift: "Morning",
      status: "On Duty",
      assignedWing: "All",
    },
    {
      societyId: greenValley._id,
      name: "Kavita Rane",
      phone: "9822005533",
      role: "Housekeeping",
      shift: "Morning",
      status: "On Duty",
      assignedWing: "Wing B",
    },
    {
      societyId: greenValley._id,
      name: "Balwant Singh",
      phone: "9822005544",
      role: "Security Guard",
      shift: "Morning",
      status: "On Duty",
      assignedWing: "Main Gate",
    },
  ]);

  // 12. Create Deliveries
  await Delivery.create([
    {
      societyId: harmony._id,
      flatId: flatA402._id,
      wing: "A",
      flatNumber: "A-402",
      recipientName: "Ananya Rao",
      courierCompany: "Amazon",
      trackingNumber: "AMZ-9912048",
      parcelDetails: "Medium cardboard parcel",
      receivedBy: guardUser._id,
      receivedAt: new Date(Date.now() - 2 * 3600 * 1000),
      status: "Waiting for Pickup",
    },
  ]);

  // 13. Create Emergency Alert
  await EmergencyAlert.create({
    societyId: harmony._id,
    reportedBy: residentUser._id,
    reporterName: "Ananya Rao",
    reporterPhone: "9820011223",
    alertType: "Lift Emergency",
    location: "Wing B, Lift 1",
    flatId: flatA402._id,
    wing: "B",
    description: "Lift is stopped between floors 6 and 7.",
    priority: "Critical",
    status: "Active",
  });

  // 14. Create Notification
  await Notification.create({
    societyId: harmony._id,
    recipientId: residentUser._id,
    type: "visitor",
    title: "Visitor Waiting at Main Gate",
    message: "Sunil Delivery (Amazon) is waiting for entry approval to Flat A-402.",
    relatedResource: "visitor",
    isRead: false,
  });

  console.log("\n=======================================================");
  console.log("  HARMONY SOCIETY DATABASE SEED COMPLETE!");
  console.log("=======================================================");
  console.log("Demo Accounts (Password: password123 or role-based e.g. Resident@123):");
  console.log("  1. Resident:       demo@resident.com   OR   resident@harmony.com");
  console.log("  2. Secretary:      demo@secretary.com  OR   secretary@harmony.com");
  console.log("  3. Security Guard: demo@security.com   OR   guard@harmony.com");
  console.log("  4. Superadmin:     admin@harmony.com");
  console.log("=======================================================\n");
}

async function cli() {
  const mongoUri = process.env.MONGODB_URI;
  console.log(`[Seed] Connecting to: ${mongoUri?.replace(/:([^:@]+)@/, ":****@") || "default URI"}...`);

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 6000 });
    console.log("[Seed] Connected to MongoDB. Seeding collections...");
    await runSeed();
    await mongoose.disconnect();
  } catch (err) {
    console.error("\n================================================================================");
    console.error("❌ MONGODB CONNECTION FAILED");
    console.error("================================================================================");
    console.error(`Error: ${err.message}`);
    if (err.message?.includes("bad auth")) {
      console.error("\nReason: MongoDB Atlas rejected your username or password.");
      console.error("How to fix:");
      console.error("  1. Go to https://cloud.mongodb.com -> Security -> Database Access");
      console.error("  2. Find or create user 'yashpisar00_db_user' and reset the password.");
      console.error("  3. Ensure role has 'Read and write to any database'.");
      console.error("  4. In Security -> Network Access, ensure '0.0.0.0/0' is enabled.");
      console.error("  5. Update backend/.env with the valid connection string.");
    }
    console.error("================================================================================\n");
    process.exit(1);
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  cli();
}
