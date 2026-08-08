import DashboardLayout from "../../../shared/layout/DashboardLayout";

const chefNav = [
  {
    label: "Vue d'ensemble",
    items: [
      { to: "/chef", end: true, label: "Tableau de bord", icon: "◆" },
    ],
  },
  {
    label: "Transport",
    items: [
      {
        to: "/chef/bus",
        label: "Bus",
        icon: "▣",
        match: (path) => path.startsWith("/chef/bus"),
      },
      {
        to: "/chef/lignes",
        label: "Lignes",
        icon: "◎",
        match: (path) => path.startsWith("/chef/lignes"),
      },
      {
        to: "/chef/trajets",
        label: "Trajets",
        icon: "▸",
        match: (path) => path.startsWith("/chef/trajets"),
      },
      {
        to: "/chef/tarifs",
        label: "Tarifs",
        icon: "$",
        match: (path) => path.startsWith("/chef/tarifs"),
      },
    ],
  },
  {
    label: "Organisation",
    items: [
      {
        to: "/chef/employes",
        label: "Employés",
        icon: "◌",
        match: (path) => path.startsWith("/chef/employes"),
      },
      {
        to: "/chef/historique",
        label: "Historique",
        icon: "◷",
        match: (path) => path.startsWith("/chef/historique"),
      },
    ],
  },
];

const titleMap = {
  "/chef": "Tableau de bord",
  "/chef/bus": "Flotte de bus",
  "/chef/bus/creer": "Ajouter un bus",
  "/chef/lignes": "Lignes",
  "/chef/lignes/creer": "Créer une ligne",
  "/chef/trajets": "Trajets",
  "/chef/trajets/creer": "Créer un trajet",
  "/chef/tarifs": "Tarifs",
  "/chef/tarifs/creer": "Définir un tarif",
  "/chef/employes": "Employés",
  "/chef/employes/inscrire": "Employés",
  "/chef/historique": "Historique",
};

function ChefLayout() {
  const username = localStorage.getItem("username") || "Chef";

  return (
    <DashboardLayout
      brand="TERRASSO"
      brandSub="Espace compagnie"
      navGroups={chefNav}
      titleMap={titleMap}
      userLabel={username}
      userRole="Chef de compagnie"
    />
  );
}

export default ChefLayout;
