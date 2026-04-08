// client/src/pages/automation-help.tsx — NEW FILE
import { useState } from "react";
import {
  ExternalLink,
  Mail,
  MessageSquare,
  Phone,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  HeadphonesIcon,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ── Step Image Placeholder (replace with actual screenshots) ─────────────────
function StepImage({ alt, description }: { alt: string; description: string }) {
  return (
    <div className="w-full rounded-xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center py-8 gap-2 my-3">
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
        <BookOpen className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-xs font-medium text-muted-foreground">{alt}</p>
      <p className="text-xs text-muted-foreground/70">{description}</p>
    </div>
  );
}

// ── Expandable Section ────────────────────────────────────────────────────────
function Section({
  title,
  icon,
  color,
  badge,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="rounded-2xl border-border/50 overflow-hidden">
      <button className="w-full" onClick={() => setOpen(!open)}>
        <CardHeader className="pb-3 hover:bg-muted/30 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center ${color}`}
              >
                {icon}
              </div>
              <div className="text-left">
                <CardTitle className="text-base">{title}</CardTitle>
                {badge && (
                  <Badge variant="outline" className="text-xs mt-0.5">
                    {badge}
                  </Badge>
                )}
              </div>
            </div>
            {open ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
      </button>
      {open && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}

// ── Step Component ────────────────────────────────────────────────────────────
function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 py-3 border-b border-border/40 last:border-0">
      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {number}
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-sm font-semibold">{title}</p>
        <div className="text-xs text-muted-foreground space-y-1">
          {children}
        </div>
      </div>
    </div>
  );
}

function LinkButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium mt-1"
    >
      <ExternalLink className="w-3 h-3" /> {children}
    </a>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AutomationHelpPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-primary" /> Automation Setup Guide
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Complete step-by-step guide to set up Email, SMS and WhatsApp
          automation for your institute.
        </p>
      </div>

      {/* Overview */}
      <Card className="rounded-2xl bg-primary/5 border-primary/20">
        <CardContent className="pt-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> What you will need:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                icon: <Mail className="w-4 h-4" />,
                label: "Email",
                service: "SendGrid (Free)",
                link: "https://sendgrid.com",
              },
              {
                icon: <MessageSquare className="w-4 h-4" />,
                label: "SMS",
                service: "Twilio (Paid)",
                link: "https://twilio.com",
              },
              {
                icon: <Phone className="w-4 h-4" />,
                label: "WhatsApp",
                service: "Twilio (Paid)",
                link: "https://twilio.com",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 p-3 bg-white rounded-xl border border-border/50"
              >
                <div className="text-primary">{item.icon}</div>
                <div>
                  <p className="text-xs font-semibold">{item.label}</p>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    {item.service}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── SECTION 1: Twilio Account ────────────────────────────────────── */}
      <Section
        title="Step 1: Create a Twilio Account"
        icon={<Zap className="w-5 h-5" />}
        color="text-purple-600 bg-purple-50 border-purple-200"
        badge="Required for SMS & WhatsApp"
        defaultOpen={true}
      >
        <div className="space-y-0">
          <Step number={1} title="Go to Twilio website">
            <p>
              Open your browser and go to{" "}
              <LinkButton href="https://www.twilio.com/try-twilio">
                twilio.com/try-twilio
              </LinkButton>
            </p>
            <StepImage
              alt="Twilio Homepage"
              description="Screenshot: Twilio.com homepage with Sign Up button"
            />
          </Step>

          <Step number={2} title='Click "Sign Up for Free"'>
            <p>Click the red "Sign Up for Free" button on the top right.</p>
            <p>Fill in your First Name, Last Name, Email, and Password.</p>
            <StepImage
              alt="Twilio Sign Up Form"
              description="Screenshot: Twilio sign up form with fields"
            />
          </Step>

          <Step number={3} title="Verify your Email">
            <p>Check your email inbox for a verification email from Twilio.</p>
            <p>Click the "Confirm Your Email" button in the email.</p>
            <StepImage
              alt="Twilio Email Verification"
              description="Screenshot: Verification email from Twilio"
            />
          </Step>

          <Step number={4} title="Complete Phone Verification">
            <p>Twilio will ask for your phone number for verification.</p>
            <p>
              Enter your Indian mobile number with country code:{" "}
              <strong>+91XXXXXXXXXX</strong>
            </p>
            <p>You will receive an OTP — enter it to verify.</p>
            <StepImage
              alt="Phone Verification"
              description="Screenshot: Twilio phone verification screen"
            />
          </Step>

          <Step number={5} title="Answer onboarding questions">
            <p>Twilio will ask a few questions about your usage. Select:</p>
            <p>• "With code" → "Python" or "Node.js"</p>
            <p>• "Send Messages" → "SMS"</p>
            <p>• "For an organization I work for"</p>
            <p>
              After this, your account is ready with{" "}
              <strong>$15 free trial credits!</strong>
            </p>
            <StepImage
              alt="Twilio Onboarding"
              description="Screenshot: Twilio onboarding questions"
            />
          </Step>
        </div>
      </Section>

      {/* ── SECTION 2: Get Account SID & Auth Token ──────────────────────── */}
      <Section
        title="Step 2: Get Account SID & Auth Token"
        icon={<CheckCircle2 className="w-5 h-5" />}
        color="text-blue-600 bg-blue-50 border-blue-200"
        badge="Required for SMS & WhatsApp"
      >
        <div className="space-y-0">
          <Step number={1} title="Go to Twilio Console">
            <p>After login, you will be on the Console Dashboard.</p>
            <p>
              Or visit:{" "}
              <LinkButton href="https://console.twilio.com">
                console.twilio.com
              </LinkButton>
            </p>
            <StepImage
              alt="Twilio Console Dashboard"
              description="Screenshot: Twilio Console with Account Info section"
            />
          </Step>

          <Step number={2} title='Find "Account Info" section'>
            <p>On the Console homepage, look for the "Account Info" box.</p>
            <p>
              You will see <strong>Account SID</strong> — it starts with "AC..."
            </p>
            <StepImage
              alt="Account SID location"
              description="Screenshot: Account SID highlighted in Twilio Console"
            />
          </Step>

          <Step number={3} title="Copy your Account SID">
            <p>Click the copy icon next to the Account SID.</p>
            <p>
              Paste it in the automation settings → SMS/WhatsApp → Account SID
              field.
            </p>
          </Step>

          <Step number={4} title="Get your Auth Token">
            <p>
              Below Account SID, you will see <strong>Auth Token</strong>{" "}
              (hidden by default).
            </p>
            <p>Click the eye icon (👁️) or "Show" button to reveal it.</p>
            <p>Copy it and paste in the Auth Token field.</p>
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-700 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Important: Never share your
                Auth Token with anyone!
              </p>
            </div>
            <StepImage
              alt="Auth Token location"
              description="Screenshot: Auth Token with Show button in Twilio Console"
            />
          </Step>
        </div>
      </Section>

      {/* ── SECTION 3: SMS Setup ─────────────────────────────────────────── */}
      <Section
        title="Step 3: Get a Phone Number for SMS"
        icon={<MessageSquare className="w-5 h-5" />}
        color="text-green-600 bg-green-50 border-green-200"
        badge="For SMS only"
      >
        <div className="space-y-0">
          <Step number={1} title="Go to Phone Numbers section">
            <p>In Twilio Console left sidebar, click:</p>
            <p>
              <strong>Phone Numbers → Manage → Buy a number</strong>
            </p>
            <p>
              Or visit:{" "}
              <LinkButton href="https://console.twilio.com/us1/develop/phone-numbers/manage/incoming">
                Buy Phone Number
              </LinkButton>
            </p>
            <StepImage
              alt="Phone Numbers menu"
              description="Screenshot: Left sidebar with Phone Numbers option"
            />
          </Step>

          <Step number={2} title="Search for Indian numbers">
            <p>
              In the Country dropdown, select <strong>India (IN)</strong>
            </p>
            <p>
              Under Capabilities, make sure <strong>SMS</strong> is checked.
            </p>
            <p>Click Search.</p>
            <StepImage
              alt="Phone number search"
              description="Screenshot: Phone number search with India selected and SMS capability"
            />
          </Step>

          <Step number={3} title="Buy a number">
            <p>Select any available number from the list.</p>
            <p>Click "Buy" and confirm the purchase.</p>
            <p>Note: Indian numbers cost approx. $1-2/month.</p>
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-xs">
                💡 Tip: For testing, you can use the free trial to send to
                verified numbers only.
              </p>
            </div>
            <StepImage
              alt="Buy phone number"
              description="Screenshot: Number selection and Buy button"
            />
          </Step>

          <Step number={4} title="Copy your phone number">
            <p>
              Go to <strong>Phone Numbers → Manage → Active Numbers</strong>
            </p>
            <p>
              Copy your number in format: <strong>+91XXXXXXXXXX</strong>
            </p>
            <p>Paste it in Automation → SMS → Twilio Phone Number field.</p>
            <StepImage
              alt="Active Numbers"
              description="Screenshot: Active numbers list with copy button"
            />
          </Step>
        </div>
      </Section>

      {/* ── SECTION 4: WhatsApp Setup ────────────────────────────────────── */}
      <Section
        title="Step 4: Setup WhatsApp (Twilio Sandbox)"
        icon={<Phone className="w-5 h-5" />}
        color="text-emerald-600 bg-emerald-50 border-emerald-200"
        badge="For WhatsApp only"
      >
        <div className="space-y-0">
          <Step number={1} title="Go to WhatsApp Sandbox">
            <p>In Twilio Console, go to:</p>
            <p>
              <strong>Messaging → Try it out → Send a WhatsApp message</strong>
            </p>
            <p>
              Or visit:{" "}
              <LinkButton href="https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn">
                WhatsApp Sandbox
              </LinkButton>
            </p>
            <StepImage
              alt="WhatsApp Sandbox"
              description="Screenshot: Twilio WhatsApp sandbox page"
            />
          </Step>

          <Step number={2} title="Activate the Sandbox">
            <p>
              You will see a sandbox WhatsApp number (like:{" "}
              <strong>+1 415 523 8886</strong>)
            </p>
            <p>
              Send "join [keyword]" message to this number from your WhatsApp to
              activate sandbox.
            </p>
            <StepImage
              alt="Sandbox activation"
              description="Screenshot: Sandbox number and join instruction"
            />
          </Step>

          <Step number={3} title="Copy the Sandbox number">
            <p>
              Copy the sandbox number in format:{" "}
              <strong>whatsapp:+14155238886</strong>
            </p>
            <p>Paste it in Automation → WhatsApp → WhatsApp Number field.</p>
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-700 text-xs font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Note: Sandbox is for testing
                only. For production, you need to apply for WhatsApp Business
                API approval from Meta through Twilio. This process takes 2-7
                days.
              </p>
            </div>
            <LinkButton href="https://www.twilio.com/whatsapp/request-access">
              Apply for WhatsApp Business Access
            </LinkButton>
          </Step>

          <Step number={4} title="For Production WhatsApp">
            <p>After Meta approves your WhatsApp Business Account:</p>
            <p>1. Your own business number will be registered on Twilio</p>
            <p>2. Replace the sandbox number with your approved number</p>
            <p>
              3. Students can message from any WhatsApp without joining sandbox
            </p>
          </Step>
        </div>
      </Section>

      {/* ── SECTION 5: Email Setup (SendGrid) ───────────────────────────── */}
      <Section
        title="Step 5: Setup Email (SendGrid)"
        icon={<Mail className="w-5 h-5" />}
        color="text-blue-600 bg-blue-50 border-blue-200"
        badge="For Email only — Free plan available"
      >
        <div className="space-y-0">
          <Step number={1} title="Create a SendGrid account">
            <p>
              Go to{" "}
              <LinkButton href="https://signup.sendgrid.com">
                signup.sendgrid.com
              </LinkButton>
            </p>
            <p>Fill in your details and create a free account.</p>
            <p>
              SendGrid Free plan allows <strong>100 emails/day</strong> — enough
              for most institutes.
            </p>
            <StepImage
              alt="SendGrid signup"
              description="Screenshot: SendGrid signup page"
            />
          </Step>

          <Step number={2} title="Verify your email address">
            <p>
              SendGrid will send a verification email — click the link to
              verify.
            </p>
            <p>After login, complete the setup wizard.</p>
          </Step>

          <Step number={3} title="Create an API Key">
            <p>
              Go to <strong>Settings → API Keys → Create API Key</strong>
            </p>
            <p>
              Or visit:{" "}
              <LinkButton href="https://app.sendgrid.com/settings/api_keys">
                SendGrid API Keys
              </LinkButton>
            </p>
            <StepImage
              alt="API Keys menu"
              description="Screenshot: SendGrid Settings menu with API Keys option"
            />
          </Step>

          <Step number={4} title="Configure the API Key">
            <p>
              Name it: <strong>Zalgo ERP</strong>
            </p>
            <p>
              Select <strong>Full Access</strong> (or Restricted with Mail Send
              permission)
            </p>
            <p>
              Click <strong>Create & View</strong>
            </p>
            <StepImage
              alt="Create API Key form"
              description="Screenshot: API Key creation form with Full Access selected"
            />
          </Step>

          <Step number={5} title="Copy your API Key">
            <p>
              Your API key will be shown <strong>only once</strong> — copy it
              immediately!
            </p>
            <p>It starts with "SG." and is a long string.</p>
            <p>Paste it in Automation → Email → SendGrid API Key field.</p>
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-xs font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Warning: This key will not
                be shown again! Save it somewhere safe.
              </p>
            </div>
            <StepImage
              alt="API Key display"
              description="Screenshot: Generated API key with copy button"
            />
          </Step>

          <Step number={6} title="Verify your Sender Email">
            <p>
              Go to{" "}
              <strong>
                Settings → Sender Authentication → Single Sender Verification
              </strong>
            </p>
            <p>
              Or:{" "}
              <LinkButton href="https://app.sendgrid.com/settings/sender_auth">
                Sender Authentication
              </LinkButton>
            </p>
            <p>Click "Create New Sender" and enter your institute email.</p>
            <p>
              Verify it — this email will appear as "From" in your automated
              messages.
            </p>
            <StepImage
              alt="Sender Authentication"
              description="Screenshot: Single Sender Verification page"
            />
          </Step>
        </div>
      </Section>

      {/* ── SECTION 6: Enter in App ──────────────────────────────────────── */}
      <Section
        title="Step 6: Enter Credentials in the App"
        icon={<CheckCircle2 className="w-5 h-5" />}
        color="text-primary bg-primary/10 border-primary/30"
        badge="Final step"
      >
        <div className="space-y-0">
          <Step number={1} title="Go to Automation page">
            <p>
              In the left sidebar, click <strong>Automation</strong>
            </p>
            <p>
              Go to <strong>Channel Setup</strong> tab
            </p>
          </Step>
          <Step number={2} title="Enable the channels you want">
            <p>
              Toggle on the channels you have credentials for (Email, SMS,
              WhatsApp)
            </p>
            <p>The form will expand showing the fields to fill.</p>
          </Step>
          <Step number={3} title="Fill in your credentials">
            <p>Enter the credentials you copied from Twilio/SendGrid</p>
            <p>
              Click <strong>"Save Settings"</strong> for each channel
            </p>
            <p>
              You will see a green "Configured" badge when saved successfully.
            </p>
          </Step>
          <Step number={4} title="Set up Automation Triggers">
            <p>
              Go to <strong>Automation Triggers</strong> tab
            </p>
            <p>
              Enable the triggers you want (e.g. Fee Reminder, Birthday Wish)
            </p>
            <p>
              Select which channels to send on, and customize the message
              template
            </p>
          </Step>
          <Step number={5} title="Test with Manual Send">
            <p>
              Go to <strong>Send Manual Message</strong> tab
            </p>
            <p>
              Send a test message to your own number/email to verify everything
              works.
            </p>
          </Step>
        </div>
      </Section>

      {/* ── Support Section ──────────────────────────────────────────────── */}
      <Card className="rounded-2xl border-border/50 bg-gradient-to-br from-slate-50 to-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <HeadphonesIcon className="w-5 h-5 text-primary" /> Need Help?
            Contact Support
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Our team is available to help you set up automation. Reach out via
            any channel below.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Email */}
            <a
              href="mailto:support@zalgostore.com"
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-white hover:bg-muted/30 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold">Email Support</p>
                <p className="text-xs text-primary">support@zalgostore.com</p>
              </div>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/917470889548?text=Hi%2C%20I%20need%20help%20with%20automation%20setup%20in%20Zalgo%20ERP"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-white hover:bg-muted/30 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold">WhatsApp</p>
                <p className="text-xs text-primary">+91 7470889548</p>
              </div>
            </a>

            {/* Call */}
            <a
              href="tel:+917470889548"
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-white hover:bg-muted/30 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                <HeadphonesIcon className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs font-semibold">Call Us</p>
                <p className="text-xs text-primary">+91 7470889548</p>
              </div>
            </a>
          </div>

          <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Support hours: Monday–Saturday, 10 AM – 6 PM IST. For urgent
              issues, WhatsApp is the fastest way to reach us.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              {
                label: "Twilio Sign Up",
                url: "https://www.twilio.com/try-twilio",
              },
              { label: "Twilio Console", url: "https://console.twilio.com" },
              {
                label: "Buy Twilio Number",
                url: "https://console.twilio.com/us1/develop/phone-numbers/manage/incoming",
              },
              {
                label: "WhatsApp Sandbox",
                url: "https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn",
              },
              { label: "SendGrid Sign Up", url: "https://signup.sendgrid.com" },
              {
                label: "SendGrid API Keys",
                url: "https://app.sendgrid.com/settings/api_keys",
              },
              {
                label: "SendGrid Sender Verify",
                url: "https://app.sendgrid.com/settings/sender_auth",
              },
              {
                label: "WhatsApp Business Access",
                url: "https://www.twilio.com/whatsapp/request-access",
              },
            ].map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-border hover:bg-muted/30 transition-colors text-xs"
              >
                <span className="font-medium">{link.label}</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Go to Automation */}
      <div className="flex justify-center pb-4">
        <a href="/automation">
          <Button className="gap-2">
            <Zap className="w-4 h-4" /> Go to Automation Setup
            <ArrowRight className="w-4 h-4" />
          </Button>
        </a>
      </div>
    </div>
  );
}
