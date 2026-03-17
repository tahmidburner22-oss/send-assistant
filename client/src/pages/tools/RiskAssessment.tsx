/**
 * Risk Assessment — Interactive wizard that builds a full educational visit
 * risk assessment in the COBS format, matching the provided document exactly.
 *
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 */
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import {
  ClipboardList, ChevronRight, ChevronLeft, Plus, Trash2,
  Printer, FileDown, Check, AlertTriangle, Users, Wrench,
  MapPin, Car, Phone, User, Building2, Calendar, Clock,
  Shield, X, Info
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StudentInfo {
  id: string;
  initials: string;
  medicalInfo: string;
  diagnosedConditions: string;
  otherInfo: string;
}

interface RiskAssessmentData {
  // Header
  schoolName: string;
  group: string;
  venueName: string;
  venueAddress: string;
  studentCount: string;
  date: string;
  schoolNo: string;
  activity: string;
  runTime: string;

  // Section 1 — Type of Group
  groupDescription: string;
  studentInitials: string; // comma-separated
  briefingDetails: string;
  consentDetails: string;

  // Section 2 — Staffing
  staffRatio: string;
  tripLead: string;
  tripLeadPhone: string;
  minibusDriver: string;
  firstAider: string;
  additionalStaff: string;
  staffTraining: string;

  // Section 3 — Equipment
  equipmentList: string;
  equipmentManager: string;
  additionalEquipment: string;

  // Section 4 — Venue/Environment
  venueHazards: string;
  venueMeasures: string;
  dysregulationPlan: string;

  // Section 5 — Travel
  transportType: string;
  departureTime: string;
  returnTime: string;
  routePlan: string;
  seatbeltCheck: string;
  dropPoint: string;

  // Section 6 — Emergency Procedures
  nearestHospital: string;
  hospitalDistance: string;
  hospitalTime: string;
  campusMobile: string;
  campusPhone: string;
  accidentProcedure: string;
  lostChildProcedure: string;
  breakdownProcedure: string;
  garageContact: string;

  // Signatures
  visitLeader: string;
  visitLeaderDate: string;
  evc: string;
  evcDate: string;
  hoc: string;
  hocDate: string;

  // Children's information table
  children: StudentInfo[];
}

// ── Step definitions ──────────────────────────────────────────────────────────

interface Step {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}

const STEPS: Step[] = [
  { id: 1, title: "Trip Overview", subtitle: "School, venue & basic details", icon: <Building2 className="w-5 h-5" />, color: "bg-blue-600" },
  { id: 2, title: "Type of Group", subtitle: "Students & briefing details", icon: <Users className="w-5 h-5" />, color: "bg-purple-600" },
  { id: 3, title: "Staffing", subtitle: "Staff roles & ratios", icon: <User className="w-5 h-5" />, color: "bg-indigo-600" },
  { id: 4, title: "Equipment", subtitle: "Required equipment & kit", icon: <Wrench className="w-5 h-5" />, color: "bg-amber-600" },
  { id: 5, title: "Venue & Environment", subtitle: "Hazards & control measures", icon: <MapPin className="w-5 h-5" />, color: "bg-orange-600" },
  { id: 6, title: "Travel", subtitle: "Transport & journey details", icon: <Car className="w-5 h-5" />, color: "bg-teal-600" },
  { id: 7, title: "Emergency Procedures", subtitle: "Hospital, contacts & procedures", icon: <Phone className="w-5 h-5" />, color: "bg-red-600" },
  { id: 8, title: "Children's Information", subtitle: "Medical & support needs per pupil", icon: <Shield className="w-5 h-5" />, color: "bg-green-600" },
  { id: 9, title: "Signatures", subtitle: "Sign off & dates", icon: <Check className="w-5 h-5" />, color: "bg-gray-700" },
];

// ── Default data ──────────────────────────────────────────────────────────────

const DEFAULT_DATA: RiskAssessmentData = {
  schoolName: "",
  group: "",
  venueName: "",
  venueAddress: "",
  studentCount: "",
  date: "",
  schoolNo: "",
  activity: "",
  runTime: "",
  groupDescription: "Mixture of behaviour and ability group",
  studentInitials: "",
  briefingDetails: "Pupils will be fully briefed regarding emergency procedures such as a meeting place at the venue in case they get lost. Pupils will be told to always stay with the designated teacher. Pupils will strictly be told not to wander off. Pupils will also have been fully briefed on the expectations of behaving and acting appropriately within the campus regarding social interaction amongst each other and school etiquette. Pupils will be warned if their behaviour is unacceptable, they will be escorted immediately back to the campus by a member of staff.",
  consentDetails: "Parents will be texted to inform them of the trip and will have signed a consent sheet. Consent letters/text to be sent home/advise of the timing of the session. Individual student Risk Assessments to be reviewed prior to the trip to ensure they can access this. HOC/DHOC to identify any potential conflicts with students within campus to ensure minimum disruption.",
  staffRatio: "1:3 (approx.)",
  tripLead: "",
  tripLeadPhone: "",
  minibusDriver: "",
  firstAider: "",
  additionalStaff: "",
  staffTraining: "All staff are Team Teach trained. For the duration of the trip, staff are responsible for students and must manage their behaviour and keep them safe.",
  equipmentList: "Medical folder (if required)\nFirst aid kit\nPupil list\nEmergency contact numbers\nCharged mobile phones",
  equipmentManager: "",
  additionalEquipment: "Books/materials to be carried safely. Pupils instructed not to carry excessive weight. Staff to support if needed. Pupils to be wanded prior to getting on minibus, phones to be kept in school as normal school day procedures. Pupil list and RAs to be held by lead staff. Minibus to have first aid kit and fire extinguisher.",
  venueHazards: "Slips, trips, stairs\nMovement around unfamiliar campus\nFire evacuation",
  venueMeasures: "Staff sign in at reception.\nVenue staff aware of visit.\nPupils supervised at all times.\nPupils instructed to walk, not run.\nFire exits identified on arrival.\nIn case of evacuation, follow venue procedures.\nPupils remain together at all times.\nUnder no circumstances are pupils allowed to venture to other parts of the campus, unless using rest rooms and accompanied by a member of staff.\nAll staff to familiarise themselves with this Risk Assessment.\nPrior to arrival at the venue, all staff and students to be made aware of the Fire Evacuation Procedure.",
  dysregulationPlan: "If a pupil becomes dysregulated: One staff member supports pupil. Second staff supervises remainder of group. Any student who is unable to cope with the environment of the venue, designated staff member to take them outside for fresh air. OK to return pupil to campus if necessary.",
  transportType: "Minibus",
  departureTime: "",
  returnTime: "",
  routePlan: "Minibus driver to plan preferred route prior to trip – this to be printed out and given to contact at campus prior to leaving for the venue. Minibus to be up to date with service and have been thoroughly checked that it is safe and ready to drive prior to trip.",
  seatbeltCheck: "Pupils to always wear seatbelts (to be checked by allocated staff prior to leaving) on the minibus and to walk with their allocated staff member at all times. Seating plans to be adhered to. Staff at back of minibus must check that children are always wearing seatbelts.",
  dropPoint: "Minibus to drop students and staff at drop point outside the venue to minimise potential risks in crossing public roads. Minibus driver to contact campus/HOC when they have arrived safely at the venue. When back at campus, pupils will be expected to make their own way home as normal at normal dismissal time.",
  nearestHospital: "",
  hospitalDistance: "",
  hospitalTime: "",
  campusMobile: "",
  campusPhone: "",
  accidentProcedure: "Make injured party and rest of the group members safe.\nRemove any dangers where possible.\nFirst aid qualified person to administer appropriate first aid.\nIf emergency services are needed, they are to be called at the earliest opportunity. 999 or 112.\nHeads of campus informed.\nParent/carers/guardians informed.\nAccidents forms and write up to be done and risk assessments reviewed.\nChildren involved in incident to be kept in safe environment or moved towards a safe space with sufficient staff.",
  lostChildProcedure: "Child involved in incident to be kept in a safe space until appropriately calm with trained staff, then an appropriate course of action taken depending on the situation.\nRest of group to be kept safe and supervised.\nIf available staff members to go and try and find lost pupil.\nPolice informed.\nHead of campus informed.\nParents informed.",
  breakdownProcedure: "Head of campuses informed to help with sorting transport to pick up children.\nChildren to be kept safe while waiting for help.\nIf taken off the minibus, children to be placed in a safe space away from the road and supervised at all times.",
  garageContact: "",
  visitLeader: "",
  visitLeaderDate: "",
  evc: "",
  evcDate: "",
  hoc: "",
  hocDate: "",
  children: [],
};

// ── Helper: generate unique ID ────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ── Field component ───────────────────────────────────────────────────────────
function Field({
  label, hint, children, required = false
}: { label: string; hint?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-gray-800">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      {children}
    </div>
  );
}

// ── localStorage persistence key ─────────────────────────────────────────────
const RA_STORAGE_KEY = "adaptly_risk_assessment_v1";
const RA_STEP_KEY = "adaptly_risk_assessment_step_v1";

// ── Main Component ────────────────────────────────────────────────────────────
export default function RiskAssessment() {
  const { school } = useApp();

  // Initialise from localStorage if available, otherwise use defaults
  const [step, setStep] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(RA_STEP_KEY);
      if (saved) return Math.max(1, Math.min(9, parseInt(saved, 10)));
    } catch (_) {}
    return 1;
  });

  const [data, setData] = useState<RiskAssessmentData>(() => {
    try {
      const saved = localStorage.getItem(RA_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as RiskAssessmentData;
        return { ...DEFAULT_DATA, ...parsed };
      }
    } catch (_) {}
    return { ...DEFAULT_DATA, schoolName: school?.name || "" };
  });

  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Persist data and step to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(RA_STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(RA_STORAGE_KEY + "_savedAt", new Date().toISOString());
    } catch (_) {}
  }, [data]);

  useEffect(() => {
    try { localStorage.setItem(RA_STEP_KEY, String(step)); } catch (_) {}
  }, [step]);

  const update = (field: keyof RiskAssessmentData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const addChild = () => {
    setData(prev => ({
      ...prev,
      children: [...prev.children, { id: uid(), initials: "", medicalInfo: "", diagnosedConditions: "", otherInfo: "" }]
    }));
  };

  const updateChild = (id: string, field: keyof StudentInfo, value: string) => {
    setData(prev => ({
      ...prev,
      children: prev.children.map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  const removeChild = (id: string) => {
    setData(prev => ({ ...prev, children: prev.children.filter(c => c.id !== id) }));
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const popup = window.open("", "_blank", "width=900,height=750,scrollbars=yes,resizable=yes");
    if (!popup) { toast.error("Please allow pop-ups for this site."); return; }
    popup.document.open();
    popup.document.write(`<!DOCTYPE html><html><head>
      <title>Risk Assessment — ${data.schoolName}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 10pt; color: #000; margin: 0; padding: 0; }
        h1 { font-size: 14pt; font-weight: bold; text-align: center; margin: 0 0 4px; }
        h2 { font-size: 11pt; font-weight: bold; margin: 8px 0 4px; }
        h3 { font-size: 10pt; font-weight: bold; margin: 6px 0 3px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        th, td { border: 1px solid #000; padding: 4px 6px; vertical-align: top; font-size: 9pt; }
        th { background: #1e3a5f; color: #fff; font-weight: bold; }
        .header-table th { background: #1e3a5f; color: #fff; }
        .section-header { background: #1e3a5f; color: #fff; font-weight: bold; padding: 5px 8px; font-size: 10pt; }
        .key-area-label { background: #d9e1f2; font-weight: bold; }
        .control-header { background: #1e3a5f; color: #fff; font-weight: bold; }
        .page-break { page-break-before: always; }
        .logo-bar { background: #1e3a5f; color: #fff; padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .logo-bar h1 { color: #fff; margin: 0; font-size: 13pt; }
        .logo-bar .subtitle { font-size: 9pt; color: #ccc; }
        .sig-table td { height: 30px; }
        pre { white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 9pt; margin: 0; }
      </style>
    </head><body>${content}</body></html>`);
    popup.document.close();
    popup.onload = () => { popup.focus(); popup.print(); };
  };

  const canProceed = (): boolean => {
    if (step === 1) return !!(data.schoolName && data.venueName && data.date && data.activity);
    return true;
  };

  // ── Render steps ────────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="School Name" required hint="The name of your school or campus">
                <Input value={data.schoolName} onChange={e => update("schoolName", e.target.value)} placeholder="e.g. City of Birmingham School" />
              </Field>
              <Field label="Group / Year" required hint="e.g. Year 10/11 Campus – Link">
                <Input value={data.group} onChange={e => update("group", e.target.value)} placeholder="e.g. Yr 11/10 Campus – Link" />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Venue Name" required hint="Name of the destination">
                <Input value={data.venueName} onChange={e => update("venueName", e.target.value)} placeholder="e.g. The Learning Centre (Alternative Campus)" />
              </Field>
              <Field label="Venue Address" hint="Full address of the venue">
                <Input value={data.venueAddress} onChange={e => update("venueAddress", e.target.value)} placeholder="e.g. 1 High Street, Town, City, AB1 2CD" />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Number of Students" required>
                <Input type="number" value={data.studentCount} onChange={e => update("studentCount", e.target.value)} placeholder="e.g. 10" />
              </Field>
              <Field label="Date of Visit" required>
                <Input type="date" value={data.date} onChange={e => update("date", e.target.value)} />
              </Field>
              <Field label="School Reference No." hint="Optional school/trip number">
                <Input value={data.schoolNo} onChange={e => update("schoolNo", e.target.value)} placeholder="e.g. 24/25-001" />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Activity / Purpose" required hint="What is the purpose of this visit?">
                <Input value={data.activity} onChange={e => update("activity", e.target.value)} placeholder="e.g. Collecting books from alternative campus" />
              </Field>
              <Field label="Run Time / Duration" hint="How long will the visit last?">
                <Input value={data.runTime} onChange={e => update("runTime", e.target.value)} placeholder="e.g. 1 hour" />
              </Field>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">Enter student <strong>initials only</strong> (e.g. RC, IA, HJ) — not full names — to protect pupil privacy on the printed document.</p>
            </div>
            <Field label="Group Description" hint="Describe the type of group (ability, behaviour mix, etc.)">
              <Input value={data.groupDescription} onChange={e => update("groupDescription", e.target.value)} placeholder="e.g. Mixture of behaviour and ability group" />
            </Field>
            <Field label="Student Initials" required hint="Enter each student's initials, separated by commas (e.g. RC, IA, HJ, AA)">
              <Textarea
                value={data.studentInitials}
                onChange={e => update("studentInitials", e.target.value)}
                placeholder="e.g. RC, IA, HJ, AA, SM, EE, KS, AK, KH, JP"
                rows={3}
                className="font-mono"
              />
            </Field>
            <Field label="Pre-Visit Briefing & Behaviour Expectations" hint="What will pupils be told before the trip?">
              <Textarea value={data.briefingDetails} onChange={e => update("briefingDetails", e.target.value)} rows={6} />
            </Field>
            <Field label="Consent & Parental Communication" hint="How will parents be informed and consent obtained?">
              <Textarea value={data.consentDetails} onChange={e => update("consentDetails", e.target.value)} rows={4} />
            </Field>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <Field label="Staff to Pupil Ratio" hint="e.g. 1:3 (approx.)">
              <Input value={data.staffRatio} onChange={e => update("staffRatio", e.target.value)} placeholder="e.g. 1:3 (approx.)" />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Trip Lead Name" required>
                <Input value={data.tripLead} onChange={e => update("tripLead", e.target.value)} placeholder="e.g. J. Smith" />
              </Field>
              <Field label="Trip Lead Phone Number" required>
                <Input value={data.tripLeadPhone} onChange={e => update("tripLeadPhone", e.target.value)} placeholder="e.g. 07700 900000" />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Minibus Driver" hint="Name of the staff member driving">
                <Input value={data.minibusDriver} onChange={e => update("minibusDriver", e.target.value)} placeholder="e.g. A. Jones" />
              </Field>
              <Field label="First Aider" hint="Name of the qualified first aider on the trip">
                <Input value={data.firstAider} onChange={e => update("firstAider", e.target.value)} placeholder="e.g. B. Taylor" />
              </Field>
            </div>
            <Field label="Additional Staff Members" hint="List any other staff attending (one per line)">
              <Textarea value={data.additionalStaff} onChange={e => update("additionalStaff", e.target.value)} rows={3} placeholder="e.g. C. Brown&#10;D. Wilson" />
            </Field>
            <Field label="Staff Training & Responsibilities" hint="What training do staff have? What are their responsibilities?">
              <Textarea value={data.staffTraining} onChange={e => update("staffTraining", e.target.value)} rows={4} />
            </Field>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <Field label="Equipment / Kit List" hint="List all equipment being taken (one item per line)">
              <Textarea value={data.equipmentList} onChange={e => update("equipmentList", e.target.value)} rows={6} placeholder="e.g. Medical folder (if required)&#10;First aid kit&#10;Pupil list&#10;Emergency contact numbers&#10;Charged mobile phones" />
            </Field>
            <Field label="Equipment Manager" hint="Who is responsible for keeping the equipment safe?">
              <Input value={data.equipmentManager} onChange={e => update("equipmentManager", e.target.value)} placeholder="e.g. Trip lead will keep the equipment safe." />
            </Field>
            <Field label="Additional Equipment Notes & Control Measures" hint="Any additional notes about equipment safety, searching pupils, etc.">
              <Textarea value={data.additionalEquipment} onChange={e => update("additionalEquipment", e.target.value)} rows={5} />
            </Field>
          </div>
        );

      case 5:
        return (
          <div className="space-y-5">
            <Field label="Identified Hazards at Venue" required hint="List the significant hazards/risks at the venue (one per line)">
              <Textarea value={data.venueHazards} onChange={e => update("venueHazards", e.target.value)} rows={4} placeholder="e.g. Slips, trips, stairs&#10;Movement around unfamiliar campus&#10;Fire evacuation" />
            </Field>
            <Field label="Control Measures for Venue" required hint="How will these hazards be controlled? (one measure per line)">
              <Textarea value={data.venueMeasures} onChange={e => update("venueMeasures", e.target.value)} rows={8} />
            </Field>
            <Field label="Dysregulation / Behaviour Management Plan" hint="What happens if a pupil becomes dysregulated at the venue?">
              <Textarea value={data.dysregulationPlan} onChange={e => update("dysregulationPlan", e.target.value)} rows={4} />
            </Field>
          </div>
        );

      case 6:
        return (
          <div className="space-y-5">
            <Field label="Mode of Transport" required hint="e.g. Minibus, Coach, Walking, Public Transport">
              <Input value={data.transportType} onChange={e => update("transportType", e.target.value)} placeholder="e.g. Minibus" />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Departure Time" required hint="Time leaving school/campus">
                <Input value={data.departureTime} onChange={e => update("departureTime", e.target.value)} placeholder="e.g. 12:30pm" />
              </Field>
              <Field label="Return Time" hint="Time leaving venue to return">
                <Input value={data.returnTime} onChange={e => update("returnTime", e.target.value)} placeholder="e.g. 1:30pm" />
              </Field>
            </div>
            <Field label="Route Plan & Vehicle Checks" hint="Details about the planned route and vehicle safety checks">
              <Textarea value={data.routePlan} onChange={e => update("routePlan", e.target.value)} rows={4} />
            </Field>
            <Field label="Seatbelt & Supervision Arrangements" hint="How will seatbelts and pupil supervision be managed during travel?">
              <Textarea value={data.seatbeltCheck} onChange={e => update("seatbeltCheck", e.target.value)} rows={4} />
            </Field>
            <Field label="Drop-off / Pick-up Arrangements" hint="Where will pupils be dropped off and picked up? What happens on return?">
              <Textarea value={data.dropPoint} onChange={e => update("dropPoint", e.target.value)} rows={4} />
            </Field>
          </div>
        );

      case 7:
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Nearest Hospital Name & Address" required>
                <Textarea value={data.nearestHospital} onChange={e => update("nearestHospital", e.target.value)} rows={3} placeholder="e.g. City General Hospital, Hospital Road, City, AB3 4EF" />
              </Field>
              <Field label="Distance to Hospital" hint="Approximate distance">
                <Input value={data.hospitalDistance} onChange={e => update("hospitalDistance", e.target.value)} placeholder="e.g. 1.4 miles" />
              </Field>
              <Field label="Estimated Travel Time" hint="Approximate time to hospital">
                <Input value={data.hospitalTime} onChange={e => update("hospitalTime", e.target.value)} placeholder="e.g. 7 mins" />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Campus Mobile Number" required hint="Mobile number for the campus/trip lead">
                <Input value={data.campusMobile} onChange={e => update("campusMobile", e.target.value)} placeholder="e.g. 07700 900123" />
              </Field>
              <Field label="Campus Landline Number" hint="Main school/campus phone number">
                <Input value={data.campusPhone} onChange={e => update("campusPhone", e.target.value)} placeholder="e.g. 0121 000 0000" />
              </Field>
            </div>
            <Field label="a) Accident / Incident Procedure" hint="Step-by-step procedure for accidents (one step per line)">
              <Textarea value={data.accidentProcedure} onChange={e => update("accidentProcedure", e.target.value)} rows={7} />
            </Field>
            <Field label="b) Lost Child Procedure" hint="Step-by-step procedure for a lost child (one step per line)">
              <Textarea value={data.lostChildProcedure} onChange={e => update("lostChildProcedure", e.target.value)} rows={6} />
            </Field>
            <Field label="c) Broken Down Vehicle Procedure" hint="Step-by-step procedure if the vehicle breaks down (one step per line)">
              <Textarea value={data.breakdownProcedure} onChange={e => update("breakdownProcedure", e.target.value)} rows={5} />
            </Field>
            <Field label="Garage / Recovery Contact" hint="Name and phone number of the garage or recovery service">
              <Input value={data.garageContact} onChange={e => update("garageContact", e.target.value)} placeholder="e.g. Local Garage Name — 01234 567890" />
            </Field>
          </div>
        );

      case 8:
        return (
          <div className="space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Sensitive Information</p>
                <p className="text-sm text-amber-700">This section contains confidential pupil medical and support information. Use student initials only — do not enter full names.</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Students on This Trip ({data.children.length})</h3>
              <Button onClick={addChild} size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-3.5 h-3.5" /> Add Student
              </Button>
            </div>
            {data.children.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
                <Shield className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No students added yet</p>
                <p className="text-sm text-gray-400 mt-1">Click "Add Student" to add each pupil's information</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.children.map((child, idx) => (
                  <Card key={child.id} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">{idx + 1}</div>
                          <span className="font-semibold text-sm text-gray-800">Student {idx + 1}</span>
                          {child.initials && <Badge variant="outline" className="text-xs font-mono">{child.initials}</Badge>}
                        </div>
                        <button onClick={() => removeChild(child.id)} className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Field label="Student Initials" required hint="e.g. RC, IA — initials only">
                          <Input
                            value={child.initials}
                            onChange={e => updateChild(child.id, "initials", e.target.value)}
                            placeholder="e.g. RC"
                            className="font-mono"
                          />
                        </Field>
                        <Field label="Medical Information" hint="Allergies, medication, medical conditions">
                          <Input
                            value={child.medicalInfo}
                            onChange={e => updateChild(child.id, "medicalInfo", e.target.value)}
                            placeholder="e.g. EpiPen for nut allergy, takes Ritalin"
                          />
                        </Field>
                        <Field label="Diagnosed Conditions" hint="e.g. ADHD, Autism, Dyslexia">
                          <Input
                            value={child.diagnosedConditions}
                            onChange={e => updateChild(child.id, "diagnosedConditions", e.target.value)}
                            placeholder="e.g. ADHD, Autism"
                          />
                        </Field>
                        <Field label="Other Information" hint="1:1 support needed, absconder risk, extra support">
                          <Input
                            value={child.otherInfo}
                            onChange={e => updateChild(child.id, "otherInfo", e.target.value)}
                            placeholder="e.g. 1:1 required, known absconder"
                          />
                        </Field>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 9:
        return (
          <div className="space-y-5">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 font-medium">Almost done! Enter the names and dates for the required sign-offs. These will appear on the printed document.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Visit Leader Name" required>
                <Input value={data.visitLeader} onChange={e => update("visitLeader", e.target.value)} placeholder="Full name of visit leader" />
              </Field>
              <Field label="Visit Leader Sign-off Date">
                <Input type="date" value={data.visitLeaderDate} onChange={e => update("visitLeaderDate", e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="EVC (Educational Visits Co-ordinator) Name">
                <Input value={data.evc} onChange={e => update("evc", e.target.value)} placeholder="Full name of EVC" />
              </Field>
              <Field label="EVC Sign-off Date">
                <Input type="date" value={data.evcDate} onChange={e => update("evcDate", e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="HOC (Head of Campus) Name">
                <Input value={data.hoc} onChange={e => update("hoc", e.target.value)} placeholder="Full name of Head of Campus" />
              </Field>
              <Field label="HOC Sign-off Date">
                <Input type="date" value={data.hocDate} onChange={e => update("hocDate", e.target.value)} />
              </Field>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-4">Your risk assessment is ready. You can preview and print it below.</p>
              <div className="flex gap-3">
                <Button onClick={() => setShowPreview(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  <ClipboardList className="w-4 h-4" /> Preview Risk Assessment
                </Button>
                <Button onClick={handlePrint} variant="outline" className="gap-2">
                  <Printer className="w-4 h-4" /> Print
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Print document HTML ──────────────────────────────────────────────────────

  const formatLines = (text: string) =>
    text.split("\n").filter(l => l.trim()).map((l, i) => `<div key="${i}">• ${l.trim()}</div>`).join("");

  const formatDate = (d: string) => {
    if (!d) return "";
    try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }); } catch { return d; }
  };

  const studentInitialsList = data.studentInitials
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const renderPrintDocument = () => (
    <div ref={printRef} style={{ fontFamily: "Arial, sans-serif", fontSize: "10pt", color: "#000" }}>

      {/* ── Header ── */}
      <div style={{ background: "#1e3a5f", color: "#fff", padding: "10px 14px", marginBottom: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: "bold", fontSize: "14pt" }}>RISK ASSESSMENT FOR EDUCATIONAL VISITS</div>
            <div style={{ fontSize: "9pt", opacity: 0.85, marginTop: "2px" }}>COBS — {data.schoolName}</div>
          </div>
          <div style={{ fontSize: "9pt", textAlign: "right", opacity: 0.85 }}>
            <div>Adaptly</div>
            <div>adaptly.co.uk</div>
          </div>
        </div>
      </div>

      {/* ── Trip Details Table ── */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "8px", fontSize: "9pt" }}>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #000", padding: "4px 6px", fontWeight: "bold", background: "#d9e1f2", width: "18%" }}>Group:</td>
            <td style={{ border: "1px solid #000", padding: "4px 6px", width: "32%" }}>{data.group}</td>
            <td style={{ border: "1px solid #000", padding: "4px 6px", fontWeight: "bold", background: "#d9e1f2", width: "18%" }}>Venue:</td>
            <td style={{ border: "1px solid #000", padding: "4px 6px", width: "32%" }}>{data.venueName}{data.venueAddress ? `, ${data.venueAddress}` : ""}</td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #000", padding: "4px 6px", fontWeight: "bold", background: "#d9e1f2" }}>Students in total:</td>
            <td style={{ border: "1px solid #000", padding: "4px 6px" }}>{data.studentCount}</td>
            <td style={{ border: "1px solid #000", padding: "4px 6px", fontWeight: "bold", background: "#d9e1f2" }}>Date:</td>
            <td style={{ border: "1px solid #000", padding: "4px 6px" }}>{formatDate(data.date)}</td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #000", padding: "4px 6px", fontWeight: "bold", background: "#d9e1f2" }}>School No:</td>
            <td style={{ border: "1px solid #000", padding: "4px 6px" }}>{data.schoolNo}</td>
            <td style={{ border: "1px solid #000", padding: "4px 6px", fontWeight: "bold", background: "#d9e1f2" }}>Activity:</td>
            <td style={{ border: "1px solid #000", padding: "4px 6px" }}>{data.activity}</td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #000", padding: "4px 6px", fontWeight: "bold", background: "#d9e1f2" }}>Run Time:</td>
            <td style={{ border: "1px solid #000", padding: "4px 6px" }} colSpan={3}>{data.runTime}</td>
          </tr>
        </tbody>
      </table>

      {/* ── Main RA Table ── */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "8px", fontSize: "9pt" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #000", padding: "5px 8px", background: "#1e3a5f", color: "#fff", width: "45%", textAlign: "left" }}>
              ASPECTS TO CONSIDER<br />
              <span style={{ fontWeight: "normal", fontSize: "8pt" }}>(List only actual significant hazards/risks)</span>
            </th>
            <th style={{ border: "1px solid #000", padding: "5px 8px", background: "#1e3a5f", color: "#fff", width: "55%", textAlign: "left" }}>
              CONTROL MEASURES<br />
              <span style={{ fontWeight: "normal", fontSize: "8pt" }}>Written evidence that the six key areas have been considered, putting into place suitable and sufficient control measures that reduce the likelihood and the severity of significant risks to an acceptable low level/rating.</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {/* PEOPLE header */}
          <tr>
            <td colSpan={2} style={{ border: "1px solid #000", padding: "4px 8px", background: "#2d5a8e", color: "#fff", fontWeight: "bold", fontSize: "10pt" }}>
              PEOPLE
            </td>
          </tr>

          {/* Section 1 — Type of Group */}
          <tr>
            <td style={{ border: "1px solid #000", padding: "6px 8px", verticalAlign: "top" }}>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>1 Type of Group: {data.groupDescription}</div>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>Student initials here:</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px" }}>
                {studentInitialsList.map((s, i) => (
                  <div key={i} style={{ padding: "1px 0" }}>{s}</div>
                ))}
              </div>
            </td>
            <td style={{ border: "1px solid #000", padding: "6px 8px", verticalAlign: "top" }}>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>Prep work</div>
              <div dangerouslySetInnerHTML={{ __html: formatLines(data.consentDetails) }} />
              <div style={{ marginTop: "6px" }} dangerouslySetInnerHTML={{ __html: formatLines(data.briefingDetails) }} />
            </td>
          </tr>

          {/* Section 2 — Staffing */}
          <tr>
            <td style={{ border: "1px solid #000", padding: "6px 8px", verticalAlign: "top" }}>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>2 Staffing:</div>
              <div>Staff to pupil ratio {data.staffRatio}</div>
              {data.minibusDriver && <div style={{ marginTop: "4px" }}><strong>Minibus driver:</strong> {data.minibusDriver}</div>}
              {data.tripLead && (
                <div style={{ marginTop: "4px" }}>
                  <div><strong>Trip Lead:</strong> {data.tripLead}</div>
                  {data.tripLeadPhone && <div><strong>Tel:</strong> {data.tripLeadPhone}</div>}
                </div>
              )}
              {data.firstAider && <div style={{ marginTop: "4px" }}><strong>First Aider:</strong> {data.firstAider}</div>}
              {data.additionalStaff && (
                <div style={{ marginTop: "4px" }}>
                  <div><strong>Additional Staff:</strong></div>
                  <div dangerouslySetInnerHTML={{ __html: formatLines(data.additionalStaff) }} />
                </div>
              )}
            </td>
            <td style={{ border: "1px solid #000", padding: "6px 8px", verticalAlign: "top" }}>
              <div dangerouslySetInnerHTML={{ __html: formatLines(data.staffTraining) }} />
            </td>
          </tr>

          {/* CONTEXT header */}
          <tr>
            <td colSpan={2} style={{ border: "1px solid #000", padding: "4px 8px", background: "#2d5a8e", color: "#fff", fontWeight: "bold", fontSize: "10pt" }}>
              CONTEXT
            </td>
          </tr>

          {/* Section 3 — Equipment */}
          <tr>
            <td style={{ border: "1px solid #000", padding: "6px 8px", verticalAlign: "top" }}>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>3 Equipment:</div>
              <div dangerouslySetInnerHTML={{ __html: formatLines(data.equipmentList) }} />
            </td>
            <td style={{ border: "1px solid #000", padding: "6px 8px", verticalAlign: "top" }}>
              {data.equipmentManager && <div style={{ marginBottom: "4px" }}>{data.equipmentManager}</div>}
              <div dangerouslySetInnerHTML={{ __html: formatLines(data.additionalEquipment) }} />
            </td>
          </tr>

          {/* Section 4 — Venue/Environment */}
          <tr>
            <td style={{ border: "1px solid #000", padding: "6px 8px", verticalAlign: "top" }}>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>4 Venue/Environment:</div>
              <div style={{ fontWeight: "bold", marginBottom: "2px" }}>Hazards:</div>
              <div dangerouslySetInnerHTML={{ __html: formatLines(data.venueHazards) }} />
              <div style={{ marginTop: "6px", fontWeight: "bold" }}>{data.venueName}</div>
              {data.venueAddress && <div style={{ fontSize: "8pt", color: "#444" }}>{data.venueAddress}</div>}
            </td>
            <td style={{ border: "1px solid #000", padding: "6px 8px", verticalAlign: "top" }}>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>Control Measures:</div>
              <div dangerouslySetInnerHTML={{ __html: formatLines(data.venueMeasures) }} />
              {data.dysregulationPlan && (
                <div style={{ marginTop: "6px" }}>
                  <div style={{ fontWeight: "bold", marginBottom: "2px" }}>If a pupil becomes dysregulated:</div>
                  <div dangerouslySetInnerHTML={{ __html: formatLines(data.dysregulationPlan) }} />
                </div>
              )}
            </td>
          </tr>

          {/* ORGANISATION header */}
          <tr>
            <td colSpan={2} style={{ border: "1px solid #000", padding: "4px 8px", background: "#2d5a8e", color: "#fff", fontWeight: "bold", fontSize: "10pt" }}>
              ORGANISATION
            </td>
          </tr>

          {/* Section 5 — Travel */}
          <tr>
            <td style={{ border: "1px solid #000", padding: "6px 8px", verticalAlign: "top" }}>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>5 Travel:</div>
              <div><strong>Transport:</strong> {data.transportType}</div>
              {data.departureTime && <div><strong>Depart:</strong> {data.departureTime}</div>}
              {data.returnTime && <div><strong>Return:</strong> {data.returnTime}</div>}
            </td>
            <td style={{ border: "1px solid #000", padding: "6px 8px", verticalAlign: "top" }}>
              <div dangerouslySetInnerHTML={{ __html: formatLines(data.routePlan) }} />
              <div style={{ marginTop: "4px" }} dangerouslySetInnerHTML={{ __html: formatLines(data.seatbeltCheck) }} />
              <div style={{ marginTop: "4px" }} dangerouslySetInnerHTML={{ __html: formatLines(data.dropPoint) }} />
            </td>
          </tr>

          {/* Section 6 — Emergency Procedures */}
          <tr>
            <td style={{ border: "1px solid #000", padding: "6px 8px", verticalAlign: "top" }}>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>6. Emergency Procedures:</div>
              <div style={{ fontWeight: "bold", marginBottom: "2px" }}>Nearest Hospital:</div>
              <div>{data.nearestHospital}</div>
              {(data.hospitalDistance || data.hospitalTime) && (
                <div style={{ marginTop: "2px", fontSize: "8pt", color: "#444" }}>
                  {data.hospitalDistance && `${data.hospitalDistance}`}{data.hospitalTime && ` (${data.hospitalTime})`}
                </div>
              )}
              {data.campusMobile && <div style={{ marginTop: "6px" }}><strong>Campus mobile:</strong> {data.campusMobile}</div>}
              {data.campusPhone && <div><strong>Campus number:</strong> {data.campusPhone}</div>}
            </td>
            <td style={{ border: "1px solid #000", padding: "6px 8px", verticalAlign: "top" }}>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>a) Accident / Incident:</div>
              <div dangerouslySetInnerHTML={{ __html: formatLines(data.accidentProcedure) }} />
              <div style={{ fontWeight: "bold", marginTop: "6px", marginBottom: "4px" }}>b) Lost Child:</div>
              <div dangerouslySetInnerHTML={{ __html: formatLines(data.lostChildProcedure) }} />
              <div style={{ fontWeight: "bold", marginTop: "6px", marginBottom: "4px" }}>c) Broken Down Vehicle:</div>
              <div dangerouslySetInnerHTML={{ __html: formatLines(data.breakdownProcedure) }} />
              {data.garageContact && <div style={{ marginTop: "4px" }}><strong>Garage/Recovery:</strong> {data.garageContact}</div>}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Signatures ── */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "12px", fontSize: "9pt" }}>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #000", padding: "5px 8px", width: "33%" }}>
              <div><strong>Visit Leader:</strong> {data.visitLeader}</div>
              <div style={{ marginTop: "4px" }}>Signed: ………………………………</div>
              <div style={{ marginTop: "4px" }}>Date: {data.visitLeaderDate ? formatDate(data.visitLeaderDate) : "……………………………"}</div>
            </td>
            <td style={{ border: "1px solid #000", padding: "5px 8px", width: "33%" }}>
              <div><strong>EVC:</strong> {data.evc}</div>
              <div style={{ marginTop: "4px" }}>Signed: ………………………………</div>
              <div style={{ marginTop: "4px" }}>Date: {data.evcDate ? formatDate(data.evcDate) : "……………………………"}</div>
            </td>
            <td style={{ border: "1px solid #000", padding: "5px 8px", width: "33%" }}>
              <div><strong>HOC:</strong> {data.hoc}</div>
              <div style={{ marginTop: "4px" }}>Signed: ………………………………</div>
              <div style={{ marginTop: "4px" }}>Date: {data.hocDate ? formatDate(data.hocDate) : "……………………………"}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Children's Information Table ── */}
      <div style={{ background: "#1e3a5f", color: "#fff", padding: "5px 8px", fontWeight: "bold", fontSize: "10pt", marginBottom: "0" }}>
        RISK ASSESSMENT – CHILDREN'S INFORMATION
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #000", padding: "5px 8px", background: "#2d5a8e", color: "#fff", textAlign: "left", width: "15%" }}>Student Initials</th>
            <th style={{ border: "1px solid #000", padding: "5px 8px", background: "#2d5a8e", color: "#fff", textAlign: "left", width: "28%" }}>Medical information (allergies, medication, medical conditions)</th>
            <th style={{ border: "1px solid #000", padding: "5px 8px", background: "#2d5a8e", color: "#fff", textAlign: "left", width: "28%" }}>Any diagnosed conditions (ADHD, autism etc)</th>
            <th style={{ border: "1px solid #000", padding: "5px 8px", background: "#2d5a8e", color: "#fff", textAlign: "left", width: "29%" }}>Other information (one to one needed, absconder, any extra support needed)</th>
          </tr>
        </thead>
        <tbody>
          {data.children.length > 0 ? data.children.map((child, idx) => (
            <tr key={child.id} style={{ background: idx % 2 === 0 ? "#fff" : "#f5f7fa" }}>
              <td style={{ border: "1px solid #000", padding: "5px 8px", fontWeight: "bold", fontFamily: "monospace" }}>{child.initials}</td>
              <td style={{ border: "1px solid #000", padding: "5px 8px" }}>{child.medicalInfo}</td>
              <td style={{ border: "1px solid #000", padding: "5px 8px" }}>{child.diagnosedConditions}</td>
              <td style={{ border: "1px solid #000", padding: "5px 8px" }}>{child.otherInfo}</td>
            </tr>
          )) : (
            // Empty rows for manual completion
            Array.from({ length: 12 }).map((_, i) => (
              <tr key={i}>
                <td style={{ border: "1px solid #000", padding: "5px 8px", height: "28px" }}></td>
                <td style={{ border: "1px solid #000", padding: "5px 8px" }}></td>
                <td style={{ border: "1px solid #000", padding: "5px 8px" }}></td>
                <td style={{ border: "1px solid #000", padding: "5px 8px" }}></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  // ── Main render ──────────────────────────────────────────────────────────────

  const currentStepInfo = STEPS[step - 1];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-sm">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg">Risk Assessment</h1>
              <p className="text-xs text-gray-500">Educational Visit — COBS Format</p>
            </div>
          </div>
          {step === 9 && (
            <div className="flex gap-2">
              <Button onClick={() => setShowPreview(true)} size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                <ClipboardList className="w-3.5 h-3.5" /> Preview
              </Button>
              <Button onClick={handlePrint} size="sm" variant="outline" className="gap-1.5">
                <Printer className="w-3.5 h-3.5" /> Print
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Step progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Step {step} of {STEPS.length}</span>
            <span className="text-sm text-gray-400">{Math.round((step / STEPS.length) * 100)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(step / STEPS.length) * 100}%` }}
            />
          </div>
          {/* Step pills */}
          <div className="flex gap-1 mt-3 flex-wrap">
            {STEPS.map(s => (
              <button
                key={s.id}
                onClick={() => s.id <= step && setStep(s.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  s.id === step
                    ? "bg-blue-600 text-white shadow-sm"
                    : s.id < step
                    ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer"
                    : "bg-gray-100 text-gray-400 cursor-default"
                }`}
              >
                {s.id < step ? <Check className="w-3 h-3" /> : null}
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Step card */}
        <Card className="border-gray-200 shadow-sm">
          <div className={`${currentStepInfo.color} rounded-t-xl px-6 py-4`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-white">
                {currentStepInfo.icon}
              </div>
              <div>
                <h2 className="font-bold text-white text-base">{currentStepInfo.title}</h2>
                <p className="text-xs text-white/80">{currentStepInfo.subtitle}</p>
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <div className="text-sm text-gray-400">{step} / {STEPS.length}</div>
          {step < STEPS.length ? (
            <Button
              onClick={() => {
                if (!canProceed()) {
                  toast.error("Please fill in the required fields before continuing.");
                  return;
                }
                setStep(s => Math.min(STEPS.length, s + 1));
              }}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handlePrint} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
              <Printer className="w-4 h-4" /> Print Risk Assessment
            </Button>
          )}
        </div>
      </div>

      {/* Hidden print element */}
      <div style={{ position: "absolute", left: "-9999px", top: 0, width: "794px" }}>
        {renderPrintDocument()}
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-gray-600" />
                <h2 className="font-bold text-gray-800 text-lg">Risk Assessment Preview</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5">
                  <Printer className="w-3.5 h-3.5" /> Print
                </Button>
                <button onClick={() => setShowPreview(false)} className="ml-2 p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[80vh] p-6 bg-white">
              {renderPrintDocument()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
