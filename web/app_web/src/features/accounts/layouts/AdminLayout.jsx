import DashboardLayout from "../../../shared/layout/DashboardLayout";

const adminNav = [
  {
    label: "Vue d'ensemble",
    items: [
      { to: "/admin", end: true, label: "Tableau de bord", icon: "◆" },
    ],
  },
  {
    label: "Ressources humaines",
    items: [
      {
        to: "/admin/inscriptionChef",
        label: "Employés",
        icon: "◎",
        match: (path) =>
          path.includes("/admin/inscription") ||
          path.includes("/admin/modification") ||
          path.includes("/admin/desactivation"),
      },
    ],
  },
  {
    label: "Opérations",
    items: [
      { label: "Réservations", icon: "▣" },
      { label: "Service client", icon: "◌" },
      { label: "Supervision", icon: "◈" },
    ],
  },
];

const titleMap = {
  "/admin": "Tableau de bord",
  "/admin/inscriptionChef": "Inscription chef",
  "/admin/inscriptionSav": "Inscription SAV",
  "/admin/inscriptionComptable": "Inscription comptable",
  "/admin/modificationChefCompagnie": "Modification chef",
  "/admin/modificationSav": "Modification SAV",
  "/admin/modificationComptable": "Modification comptable",
  "/admin/desactivationChefCompagnie": "Désactivation chef",
  "/admin/desactivationSav": "Désactivation SAV",
  "/admin/desactivationComptable": "Désactivation comptable",
};

function AdminLayout() {
  const username = localStorage.getItem("username") || "Admin";

  return (
    <DashboardLayout
      brand="TERRASSO"
      brandSub="Administration"
      navGroups={adminNav}
      titleMap={titleMap}
      userLabel={username}
      userRole="Admin plateforme"
    />
  );
}

export default AdminLayout;
