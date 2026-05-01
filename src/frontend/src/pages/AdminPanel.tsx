import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Principal } from "@dfinity/principal";
import {
  Check,
  CheckCircle,
  CreditCard,
  Edit2,
  Plus,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";
import { useAdminDeleteUserSubscription } from "../hooks/useAdminDeleteUserSubscription";
import {
  type SerializedPlan,
  useCreatePlan,
  useDeletePlan,
  useListAllPlans,
  useUpdatePlan,
} from "../hooks/useAdminPlans";
import {
  type SerializedSubscription,
  useAdminListUsers,
  useAdminUpdateSubscription,
  useRevokeSubscription,
} from "../hooks/useAdminUsers";
import { useGetPaymentDestination } from "../hooks/useGetPaymentDestination";
import { useSetPaymentDestination } from "../hooks/useSetPaymentDestination";
import { formatStorageSize, nanosecondsToDate } from "../utils/storage";

type PlanFormData = {
  priceICP: string;
  storageGB: string;
  durationDays: string;
  active: boolean;
};

const defaultPlanForm: PlanFormData = {
  priceICP: "",
  storageGB: "",
  durationDays: "",
  active: true,
};

function icpToE8s(icp: string): bigint {
  const num = Number.parseFloat(icp);
  if (Number.isNaN(num)) return 0n;
  return BigInt(Math.round(num * 1e8));
}

function e8sToIcp(e8s: string): string {
  return (Number(BigInt(e8s)) / 1e8).toFixed(4);
}

function bytesToGB(bytes: string): string {
  return (Number(BigInt(bytes)) / (1024 * 1024 * 1024)).toFixed(2);
}

function secondsToDays(seconds: string): string {
  return (Number(BigInt(seconds)) / 86400).toFixed(0);
}

function shortenPrincipal(principal: string): string {
  if (principal.length <= 16) return principal;
  return `${principal.slice(0, 8)}...${principal.slice(-6)}`;
}

export default function AdminPanel() {
  const { data: plans = [], isLoading: plansLoading } = useListAllPlans();
  const { data: paymentDestination } = useGetPaymentDestination();
  const { data: allUsers = [] } = useAdminListUsers();

  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const setPaymentDestinationMutation = useSetPaymentDestination();
  const revokeSubscription = useRevokeSubscription();
  const deleteUserSubscription = useAdminDeleteUserSubscription();
  const grantSubscription = useAdminUpdateSubscription();

  const [paymentDest, setPaymentDest] = useState("");
  const [grantPrincipal, setGrantPrincipal] = useState("");
  const [grantPlanId, setGrantPlanId] = useState("");
  const [grantError, setGrantError] = useState("");
  const [grantSuccess, setGrantSuccess] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<PlanFormData>(defaultPlanForm);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PlanFormData>(defaultPlanForm);
  const [createError, setCreateError] = useState("");
  const [editError, setEditError] = useState("");
  const [paymentDestError, setPaymentDestError] = useState("");
  const [paymentDestSuccess, setPaymentDestSuccess] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeletePrincipal, setPendingDeletePrincipal] = useState<
    string | null
  >(null);

  const handleSetPaymentDestination = async () => {
    setPaymentDestError("");
    setPaymentDestSuccess("");
    if (!paymentDest.trim()) {
      setPaymentDestError("Please enter a payment destination");
      return;
    }
    try {
      Principal.fromText(paymentDest.trim());
    } catch {
      setPaymentDestError("Invalid principal ID format");
      return;
    }
    try {
      await setPaymentDestinationMutation.mutateAsync(paymentDest.trim());
      setPaymentDestSuccess("Payment destination updated successfully");
      setPaymentDest("");
    } catch (e: unknown) {
      setPaymentDestError(
        e instanceof Error ? e.message : "Failed to set payment destination",
      );
    }
  };

  const handleCreatePlan = async () => {
    setCreateError("");
    if (
      !createForm.priceICP ||
      !createForm.storageGB ||
      !createForm.durationDays
    ) {
      setCreateError("Please fill in all required fields");
      return;
    }
    try {
      const planId = BigInt(Date.now());
      const serialized: SerializedPlan = {
        planId: planId.toString(),
        priceE8s: icpToE8s(createForm.priceICP).toString(),
        storageLimitBytes: BigInt(
          Math.round(
            Number.parseFloat(createForm.storageGB) * 1024 * 1024 * 1024,
          ),
        ).toString(),
        durationSeconds: BigInt(
          Math.round(Number.parseFloat(createForm.durationDays) * 86400),
        ).toString(),
        active: createForm.active,
      };
      await createPlan.mutateAsync(serialized);
      setShowCreateForm(false);
      setCreateForm(defaultPlanForm);
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : "Failed to create plan");
    }
  };

  const handleStartEdit = (plan: SerializedPlan) => {
    setEditingPlanId(plan.planId);
    setEditForm({
      priceICP: e8sToIcp(plan.priceE8s),
      storageGB: bytesToGB(plan.storageLimitBytes),
      durationDays: secondsToDays(plan.durationSeconds),
      active: plan.active,
    });
    setEditError("");
  };

  const handleCancelEdit = () => {
    setEditingPlanId(null);
    setEditForm(defaultPlanForm);
    setEditError("");
  };

  const handleSaveEdit = async (plan: SerializedPlan) => {
    setEditError("");
    if (!editForm.priceICP || !editForm.storageGB || !editForm.durationDays) {
      setEditError("Please fill in all required fields");
      return;
    }
    try {
      const updated: SerializedPlan = {
        planId: plan.planId,
        priceE8s: icpToE8s(editForm.priceICP).toString(),
        storageLimitBytes: BigInt(
          Math.round(
            Number.parseFloat(editForm.storageGB) * 1024 * 1024 * 1024,
          ),
        ).toString(),
        durationSeconds: BigInt(
          Math.round(Number.parseFloat(editForm.durationDays) * 86400),
        ).toString(),
        active: editForm.active,
      };
      await updatePlan.mutateAsync(updated);
      setEditingPlanId(null);
      setEditForm(defaultPlanForm);
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "Failed to update plan");
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      await deletePlan.mutateAsync(planId);
    } catch {
      // silently handle
    }
  };

  const handleRevoke = async (principal: string) => {
    try {
      await revokeSubscription.mutateAsync(principal);
    } catch {
      // silently handle
    }
  };

  const handleDeleteUserSubscription = async () => {
    if (!pendingDeletePrincipal) return;
    try {
      await deleteUserSubscription.mutateAsync(pendingDeletePrincipal);
    } finally {
      setDeleteDialogOpen(false);
      setPendingDeletePrincipal(null);
    }
  };

  const openDeleteDialog = (principal: string) => {
    setPendingDeletePrincipal(principal);
    setDeleteDialogOpen(true);
  };

  const handleGrantSubscription = async () => {
    setGrantError("");
    setGrantSuccess("");

    if (!grantPrincipal.trim()) {
      setGrantError("Please enter a user principal ID");
      return;
    }
    if (!grantPlanId) {
      setGrantError("Please select a plan");
      return;
    }

    try {
      Principal.fromText(grantPrincipal.trim());
    } catch {
      setGrantError("Invalid principal ID format");
      return;
    }

    const selectedPlan = (plans as SerializedPlan[]).find(
      (p) => p.planId === grantPlanId,
    );
    if (!selectedPlan) {
      setGrantError("Selected plan not found");
      return;
    }

    const startTime = BigInt(Date.now()) * 1_000_000n;
    const endTime =
      startTime + BigInt(selectedPlan.durationSeconds) * 1_000_000_000n;

    try {
      await grantSubscription.mutateAsync({
        principal: grantPrincipal.trim(),
        planId: grantPlanId,
        startTime: startTime.toString(),
        endTime: endTime.toString(),
        status: "active",
      });
      setGrantSuccess(
        `Subscription granted successfully to ${grantPrincipal.trim().slice(0, 12)}...`,
      );
      setGrantPrincipal("");
      setGrantPlanId("");
    } catch (e: unknown) {
      setGrantError(
        e instanceof Error ? e.message : "Failed to grant subscription",
      );
    }
  };

  const usersToDisplay: SerializedSubscription[] =
    allUsers as SerializedSubscription[];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl gradient-teal flex items-center justify-center teal-glow">
          <Shield className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display font-black text-2xl text-foreground tracking-tight">
            Admin Panel
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage plans, users, and system settings
          </p>
        </div>
      </div>

      <Tabs defaultValue="plans">
        <TabsList className="nav-pill w-full grid grid-cols-3 gap-1 p-1.5 rounded-2xl h-auto border-0 bg-transparent">
          <TabsTrigger
            value="plans"
            data-ocid="admin.plans.tab"
            className="flex items-center gap-2 py-2.5 rounded-xl text-sm font-display font-bold data-[state=active]:gradient-teal data-[state=active]:text-primary-foreground data-[state=active]:shadow-teal-sm data-[state=inactive]:text-muted-foreground transition-all duration-200"
          >
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Plans</span>
          </TabsTrigger>
          <TabsTrigger
            value="users"
            data-ocid="admin.users.tab"
            className="flex items-center gap-2 py-2.5 rounded-xl text-sm font-display font-bold data-[state=active]:gradient-teal data-[state=active]:text-primary-foreground data-[state=active]:shadow-teal-sm data-[state=inactive]:text-muted-foreground transition-all duration-200"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            data-ocid="admin.settings.tab"
            className="flex items-center gap-2 py-2.5 rounded-xl text-sm font-display font-bold data-[state=active]:gradient-teal data-[state=active]:text-primary-foreground data-[state=active]:shadow-teal-sm data-[state=inactive]:text-muted-foreground transition-all duration-200"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── Plans Tab ─── */}
        <TabsContent value="plans" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-lg text-foreground">
                Subscription Plans
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Create and manage pricing plans
              </p>
            </div>
            <button
              type="button"
              data-ocid="admin.plans.open_modal_button"
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setCreateError("");
              }}
              className="btn-teal flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Plan
            </button>
          </div>

          {showCreateForm && (
            <div className="premium-card rounded-2xl p-5 border-primary/25 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-base text-foreground">
                  Create New Plan
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateForm(defaultPlanForm);
                    setCreateError("");
                  }}
                  className="btn-ghost-teal flex items-center justify-center w-7 h-7 rounded-lg"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="create-price" className="section-label block">
                    Price (ICP)
                  </label>
                  <input
                    id="create-price"
                    type="number"
                    step="0.0001"
                    placeholder="e.g. 1.0"
                    value={createForm.priceICP}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        priceICP: e.target.value,
                      }))
                    }
                    className="input-dark w-full px-3 py-2.5 text-sm"
                    data-ocid="admin.plan.price.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="create-storage"
                    className="section-label block"
                  >
                    Storage (GB)
                  </label>
                  <input
                    id="create-storage"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 10"
                    value={createForm.storageGB}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        storageGB: e.target.value,
                      }))
                    }
                    className="input-dark w-full px-3 py-2.5 text-sm"
                    data-ocid="admin.plan.storage.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="create-duration"
                    className="section-label block"
                  >
                    Duration (Days)
                  </label>
                  <input
                    id="create-duration"
                    type="number"
                    placeholder="e.g. 30"
                    value={createForm.durationDays}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        durationDays: e.target.value,
                      }))
                    }
                    className="input-dark w-full px-3 py-2.5 text-sm"
                    data-ocid="admin.plan.duration.input"
                  />
                </div>
                <div className="space-y-1.5 flex flex-col justify-end">
                  <label
                    htmlFor="create-active"
                    className="section-label block"
                  >
                    Status
                  </label>
                  <div className="flex items-center gap-2 py-2.5">
                    <input
                      type="checkbox"
                      id="create-active"
                      checked={createForm.active}
                      onChange={(e) =>
                        setCreateForm((f) => ({
                          ...f,
                          active: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-primary"
                      data-ocid="admin.plan.active.checkbox"
                    />
                    <label
                      htmlFor="create-active"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Plan is active
                    </label>
                  </div>
                </div>
              </div>
              {createError && (
                <p className="text-sm text-destructive">{createError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  data-ocid="admin.plan.submit_button"
                  onClick={handleCreatePlan}
                  disabled={createPlan.isPending}
                  className="btn-teal flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  {createPlan.isPending ? "Creating..." : "Create Plan"}
                </button>
                <button
                  type="button"
                  data-ocid="admin.plan.cancel_button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateForm(defaultPlanForm);
                    setCreateError("");
                  }}
                  className="btn-ghost-teal flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {plansLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="glass-card rounded-2xl h-16 shimmer" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div
              data-ocid="admin.plans.empty_state"
              className="glass-card rounded-2xl p-8 text-center"
            >
              <p className="text-sm text-muted-foreground">
                No plans created yet. Add your first plan above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(plans as SerializedPlan[]).map((plan, idx) => (
                <div
                  key={plan.planId}
                  data-ocid={`admin.plan.row.${idx + 1}`}
                  className="glass-card rounded-2xl p-4"
                >
                  {editingPlanId === plan.planId ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="section-label">
                          Editing Plan #{plan.planId.slice(-6)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label
                            htmlFor={`edit-price-${plan.planId}`}
                            className="section-label block"
                          >
                            Price (ICP)
                          </label>
                          <input
                            id={`edit-price-${plan.planId}`}
                            type="number"
                            step="0.0001"
                            value={editForm.priceICP}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                priceICP: e.target.value,
                              }))
                            }
                            className="input-dark w-full px-3 py-2.5 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label
                            htmlFor={`edit-storage-${plan.planId}`}
                            className="section-label block"
                          >
                            Storage (GB)
                          </label>
                          <input
                            id={`edit-storage-${plan.planId}`}
                            type="number"
                            step="0.1"
                            value={editForm.storageGB}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                storageGB: e.target.value,
                              }))
                            }
                            className="input-dark w-full px-3 py-2.5 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label
                            htmlFor={`edit-duration-${plan.planId}`}
                            className="section-label block"
                          >
                            Duration (Days)
                          </label>
                          <input
                            id={`edit-duration-${plan.planId}`}
                            type="number"
                            value={editForm.durationDays}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                durationDays: e.target.value,
                              }))
                            }
                            className="input-dark w-full px-3 py-2.5 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5 flex flex-col justify-end">
                          <label
                            htmlFor={`edit-active-${plan.planId}`}
                            className="section-label block"
                          >
                            Status
                          </label>
                          <div className="flex items-center gap-2 py-2.5">
                            <input
                              type="checkbox"
                              id={`edit-active-${plan.planId}`}
                              checked={editForm.active}
                              onChange={(e) =>
                                setEditForm((f) => ({
                                  ...f,
                                  active: e.target.checked,
                                }))
                              }
                              className="w-4 h-4 accent-primary"
                            />
                            <label
                              htmlFor={`edit-active-${plan.planId}`}
                              className="text-sm text-muted-foreground cursor-pointer"
                            >
                              Plan is active
                            </label>
                          </div>
                        </div>
                      </div>
                      {editError && (
                        <p className="text-sm text-destructive">{editError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          data-ocid={`admin.plan.save_button.${idx + 1}`}
                          onClick={() => handleSaveEdit(plan)}
                          disabled={updatePlan.isPending}
                          className="btn-teal flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                        >
                          <Check className="w-3 h-3" />
                          {updatePlan.isPending ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          type="button"
                          data-ocid={`admin.plan.cancel_button.${idx + 1}`}
                          onClick={handleCancelEdit}
                          className="btn-ghost-teal flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="font-display font-bold text-foreground">
                            {e8sToIcp(plan.priceE8s)} ICP
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                              plan.active
                                ? "text-success bg-success/10 border-success/25"
                                : "text-muted-foreground bg-muted/50 border-border/50"
                            }`}
                          >
                            {plan.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {bytesToGB(plan.storageLimitBytes)} GB storage ·{" "}
                          {secondsToDays(plan.durationSeconds)} days
                        </div>
                        <div className="text-xs text-muted-foreground/50 font-mono">
                          ID: {plan.planId.slice(-8)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          data-ocid={`admin.plan.edit_button.${idx + 1}`}
                          onClick={() => handleStartEdit(plan)}
                          className="btn-ghost-teal flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              type="button"
                              data-ocid={`admin.plan.delete_button.${idx + 1}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Plan</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this plan? This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePlan(plan.planId)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Users Tab ─── */}
        <TabsContent value="users" className="space-y-4 mt-6">
          <div>
            <h2 className="font-display font-bold text-lg text-foreground">
              Subscribed Users
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage user subscriptions and access
            </p>
          </div>

          {/* ─── Grant Subscription Manually ─── */}
          <div className="premium-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center border border-primary/28"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.78 0.195 188 / 0.22), oklch(0.62 0.22 208 / 0.14))",
                }}
              >
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-display font-bold text-sm text-foreground">
                  Activate Subscription Manually
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enter the user's Principal ID to grant them a subscription
                  after payment
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="grant-principal"
                  className="section-label block"
                >
                  User Principal ID
                </label>
                <input
                  id="grant-principal"
                  type="text"
                  placeholder="e.g. aaaaa-aa..."
                  value={grantPrincipal}
                  onChange={(e) => {
                    setGrantPrincipal(e.target.value);
                    setGrantError("");
                    setGrantSuccess("");
                  }}
                  className="input-dark w-full px-3 py-2.5 font-mono text-sm"
                  data-ocid="admin.grant.principal.input"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="grant-plan" className="section-label block">
                  Subscription Plan
                </label>
                <select
                  id="grant-plan"
                  value={grantPlanId}
                  onChange={(e) => {
                    setGrantPlanId(e.target.value);
                    setGrantError("");
                    setGrantSuccess("");
                  }}
                  className="input-dark w-full px-3 py-2.5 text-sm appearance-none"
                  data-ocid="admin.grant.plan.select"
                >
                  <option value="" disabled>
                    Select a plan…
                  </option>
                  {(plans as SerializedPlan[])
                    .filter((p) => p.active)
                    .map((p) => (
                      <option key={p.planId} value={p.planId}>
                        {e8sToIcp(p.priceE8s)} ICP ·{" "}
                        {bytesToGB(p.storageLimitBytes)} GB ·{" "}
                        {secondsToDays(p.durationSeconds)} days
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {grantError && (
              <p
                data-ocid="admin.grant.error_state"
                className="text-sm text-destructive flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5 shrink-0" />
                {grantError}
              </p>
            )}
            {grantSuccess && (
              <p
                data-ocid="admin.grant.success_state"
                className="text-sm text-success flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                {grantSuccess}
              </p>
            )}

            <button
              type="button"
              data-ocid="admin.grant.submit_button"
              onClick={handleGrantSubscription}
              disabled={
                grantSubscription.isPending ||
                !grantPrincipal.trim() ||
                !grantPlanId
              }
              className="btn-teal flex items-center gap-2 px-4 py-2 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {grantSubscription.isPending
                ? "Granting..."
                : "Grant Subscription"}
            </button>
          </div>

          {usersToDisplay.length === 0 ? (
            <div
              data-ocid="admin.users.empty_state"
              className="glass-card rounded-2xl p-8 text-center"
            >
              <p className="text-sm text-muted-foreground">
                No subscribed users yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {usersToDisplay.map((user, idx) => {
                const isRevoked = user.status === "revoked";
                const isRevoking =
                  revokeSubscription.isPending &&
                  revokeSubscription.variables === user.principal;
                const isDeleting =
                  deleteUserSubscription.isPending &&
                  pendingDeletePrincipal === user.principal;

                return (
                  <div
                    key={user.principal}
                    data-ocid={`admin.user.row.${idx + 1}`}
                    className={`glass-card rounded-2xl p-4 ${isRevoked ? "border-warning/30" : ""}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-sm font-mono text-foreground truncate max-w-[200px]"
                            title={user.principal}
                          >
                            {shortenPrincipal(user.principal)}
                          </span>
                          {isRevoked ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-warning bg-warning/10 border border-warning/25 px-2 py-0.5 rounded-full">
                              <ShieldOff className="w-3 h-3" />
                              Revoked
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-bold text-success bg-success/10 border border-success/25 px-2 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Plan ID: {user.planId} · Storage:{" "}
                          {formatStorageSize(
                            Number(BigInt(user.storageLimitBytes)),
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Used:{" "}
                          {formatStorageSize(
                            Number(BigInt(user.usedStorageBytes)),
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Expires: {nanosecondsToDate(user.endTime)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!isRevoked && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                type="button"
                                data-ocid={`admin.user.revoke_button.${idx + 1}`}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-warning/10 border border-warning/25 text-warning hover:bg-warning/20 transition-colors"
                                disabled={isRevoking}
                              >
                                <ShieldOff className="w-3.5 h-3.5" />
                                {isRevoking ? "Revoking..." : "Revoke"}
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Revoke Subscription
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will suspend upload access for this user.
                                  Their subscription data and existing files
                                  will be preserved. The user can still download
                                  and delete their files, and can extend their
                                  subscription to regain full access.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  data-ocid={`admin.user.revoke.confirm_button.${idx + 1}`}
                                  onClick={() => handleRevoke(user.principal)}
                                  className="bg-warning/90 text-warning-foreground hover:bg-warning"
                                >
                                  Revoke Access
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {isRevoked && (
                          <span className="text-xs text-warning/70 italic">
                            Upload suspended
                          </span>
                        )}

                        <button
                          type="button"
                          data-ocid={`admin.user.delete_button.${idx + 1}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 transition-colors"
                          disabled={isDeleting}
                          onClick={() => openDeleteDialog(user.principal)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── Settings Tab ─── */}
        <TabsContent value="settings" className="space-y-4 mt-6">
          <div>
            <h2 className="font-display font-bold text-lg text-foreground">
              System Settings
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure payment destinations and system behavior
            </p>
          </div>

          <div className="premium-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center border border-primary/28"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.78 0.195 188 / 0.22), oklch(0.62 0.22 208 / 0.14))",
                }}
              >
                <ShieldAlert className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-display font-bold text-sm text-foreground">
                  Payment Destination
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All subscription payments will be sent to this principal
                </p>
              </div>
            </div>

            {paymentDestination && (
              <div className="glass-card rounded-xl p-3">
                <p className="section-label mb-1">Current Destination</p>
                <p className="font-mono text-xs text-foreground break-all">
                  {paymentDestination}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <input
                placeholder="Enter principal ID..."
                value={paymentDest}
                onChange={(e) => setPaymentDest(e.target.value)}
                className="input-dark flex-1 px-3 py-2.5 font-mono text-sm"
                data-ocid="admin.payment.destination.input"
              />
              <button
                type="button"
                data-ocid="admin.payment.save_button"
                onClick={handleSetPaymentDestination}
                disabled={setPaymentDestinationMutation.isPending}
                className="btn-teal flex items-center gap-2 px-4 py-2 rounded-xl text-sm shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                {setPaymentDestinationMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
            {paymentDestError && (
              <p
                data-ocid="admin.payment.error_state"
                className="text-sm text-destructive flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                {paymentDestError}
              </p>
            )}
            {paymentDestSuccess && (
              <p
                data-ocid="admin.payment.success_state"
                className="text-sm text-success flex items-center gap-1"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {paymentDestSuccess}
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setPendingDeletePrincipal(null);
        }}
        title="Permanently Delete User Subscription"
        description="This will permanently delete the user's subscription record AND all their files. This action cannot be undone. Are you sure you want to proceed?"
        confirmLabel="Delete Subscription & Files"
        onConfirm={handleDeleteUserSubscription}
        isLoading={deleteUserSubscription.isPending}
      />
    </div>
  );
}
