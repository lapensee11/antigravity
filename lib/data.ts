import { StructureType, Family, SubFamily, Article } from "./types";

export const initialTypes: StructureType[] = [
    { id: "1", name: "Achat", color: "bg-blue-500" },
    { id: "2", name: "Fonctionnement", color: "bg-orange-500" },
    { id: "3", name: "Production", color: "bg-green-500" },
    { id: "4", name: "Vente", color: "bg-purple-500" },
];

export const initialFamilies: Family[] = [
    {
        "id": "6c63b497-6950-482a-9cb8-97f3b890a597",
        "name": "Produits de Base",
        "code": "FA01",
        "typeId": "1"
    },
    {
        "id": "216d6349-21cb-4e94-912f-7623a8e94519",
        "name": "Fruits Secs / Epices",
        "code": "FA02",
        "typeId": "1"
    },
    {
        "id": "0b15b130-9b62-4b2a-9d90-36353d7119e2",
        "name": "Produits Laitiers",
        "code": "FA03",
        "typeId": "1"
    },
    {
        "id": "a75017e4-8f9f-442a-9d8e-7369a4e9952a",
        "name": "Produits Fermiers",
        "code": "FA04",
        "typeId": "1"
    },
    {
        "id": "e88d0859-6df2-421b-867c-9b83f3e18a09",
        "name": "Viandes",
        "code": "FA05",
        "typeId": "1"
    },
    {
        "id": "4e58b98b-7033-4f93-b6c8-6927361a4505",
        "name": "Pâtisserie",
        "code": "FA06",
        "typeId": "1"
    },
    {
        "id": "7a87e834-4536-4c8d-93cb-7183e9541a02",
        "name": "Cuisine",
        "code": "FA07",
        "typeId": "1"
    },
    {
        "id": "d6b9e9c3-1f1d-4f1e-8e8e-1a1a1a1a1a1a",
        "name": "Emballage",
        "code": "FA08",
        "typeId": "1"
    },
    {
        "id": "b2a2b2a2-b2a2-4b2a-8b2a-2b2b2b2b2b2b",
        "name": "Energie et Fluides",
        "code": "FA09",
        "typeId": "1"
    },
    {
        "id": "c3c3c3c3-c3c3-4c3c-8c3c-3c3c3c3c3c3c",
        "name": "Entretien et Hygiène",
        "code": "FA10",
        "typeId": "1"
    },
    {
        "id": "d4d4d4d4-d4d4-4d4d-8d4d-4d4d4d4d4d4d",
        "name": "Matériel",
        "code": "FA11",
        "typeId": "1"
    },
    {
        "id": "6f822d16-5823-4e00-aee8-03a2248b1943",
        "name": "Charges Externes",
        "code": "FF01",
        "typeId": "2"
    },
    {
        "id": "e7f054f5-26ec-49de-bb75-8bdc27e01eeb",
        "name": "Personnel",
        "code": "FF02",
        "typeId": "2"
    },
    {
        "id": "30709bc8-5329-4385-807c-4a5d387875b0",
        "name": "Impôts et Taxes",
        "code": "FF06",
        "typeId": "2"
    },
    {
        "id": "0b48e191-97f1-4816-96da-2a3bffdf543c",
        "name": "Honoraires",
        "code": "FF03",
        "typeId": "2"
    },
    {
        "id": "4592ec30-2809-4745-9f63-4f5df3c9b9ec",
        "name": "Marketing & Communication",
        "code": "FF04",
        "typeId": "2"
    },
    {
        "id": "34034858-689c-4579-a656-041d27d76aff",
        "name": "Maintenance et réparation Matériel",
        "code": "FF05",
        "typeId": "2"
    },
    {
        "id": "51aad1c2-e759-432c-aeb8-ec97bcc68525",
        "name": "Boulangerie",
        "code": "FP01",
        "typeId": "3"
    },
    {
        "id": "1b43a7f4-2df0-49f5-9d85-a2b112e72211",
        "name": "Viennoiserie",
        "code": "FP02",
        "typeId": "3"
    },
    {
        "id": "4aa3ac6d-bc22-42e4-88f2-3ec8d9ad0003",
        "name": "Cakes & Cie",
        "code": "FP03",
        "typeId": "3"
    },
    {
        "id": "55f7f14b-5dbb-466c-a978-ca0bd93e94ee",
        "name": "Base Commune",
        "code": "FP04",
        "typeId": "3"
    },
    {
        "id": "ec45d049-bf9d-46f0-a14f-fdff51437564",
        "name": "Pâtisserie",
        "code": "FP05",
        "typeId": "3"
    },
    {
        "id": "f24640f4-e18c-4226-9296-db3c0204d972",
        "name": "Cuisine",
        "code": "FP06",
        "typeId": "3"
    },
    {
        "id": "05296b7b-9cc8-40ae-bbd5-d8428ee770b5",
        "name": "Fours Secs",
        "code": "FP07",
        "typeId": "3"
    },
    {
        "id": "9927541a-b8ed-4e26-a4ee-ddcbd6599739",
        "name": "Beldi",
        "code": "FP08",
        "typeId": "3"
    },
    {
        "id": "21e43beb-4e43-4a71-9ee3-e4b15b2197e1",
        "name": "Gluten Diet",
        "code": "FP09",
        "typeId": "3"
    },
    {
        "id": "64e059a2-3d8e-45d7-a9b9-08b77f816330",
        "name": "Boulangerie",
        "code": "FV01",
        "typeId": "4"
    },
    {
        "id": "17f18c0a-c3e8-4954-8455-50eee85282dd",
        "name": "Viennoiseries",
        "code": "FV02",
        "typeId": "4"
    },
    {
        "id": "5acde58e-a096-4358-b955-00eb470b907c",
        "name": "Pâtisserie",
        "code": "FV03",
        "typeId": "4"
    },
    {
        "id": "0351124a-5bac-49eb-85f1-0b0ec1b08516",
        "name": "Gâteaux Secs",
        "code": "FV04",
        "typeId": "4"
    },
    {
        "id": "ee2e749e-0cc7-4da7-b604-c5c58100cfab",
        "name": "Salés",
        "code": "FV05",
        "typeId": "4"
    },
    {
        "id": "95aa67b7-a47a-4ac5-a8fe-b594fc6faeb3",
        "name": "Confiserie",
        "code": "FV06",
        "typeId": "4"
    },
    {
        "id": "f6653a40-62f3-44c4-90c2-f73ba87a2e9d",
        "name": "Gluten Diet",
        "code": "FV07",
        "typeId": "4"
    },
    {
        "id": "0eb1d4b6-fe7d-4626-92c4-b193fdc6956c",
        "name": "Supplément",
        "code": "FV08",
        "typeId": "4"
    }
];

export const initialSubFamilies: SubFamily[] = [
    {
        "id": "0d580367-723b-4629-bc47-2145e6f8a105",
        "name": "Farines",
        "code": "FA011",
        "familyId": "6c63b497-6950-482a-9cb8-97f3b890a597"
    },
    {
        "id": "d70b39d3-6587-45c1-843d-3706d922ec94",
        "name": "Sucres",
        "code": "FA012",
        "familyId": "6c63b497-6950-482a-9cb8-97f3b890a597"
    },
    {
        "id": "ed3332ee-cd12-4f1d-bf2d-4376dfff8aa1",
        "name": "Huiles",
        "code": "FA013",
        "familyId": "6c63b497-6950-482a-9cb8-97f3b890a597"
    },
    {
        "id": "81ffca1e-0108-4d6b-9612-3727249a1703",
        "name": "Base Divers",
        "code": "FA014",
        "familyId": "6c63b497-6950-482a-9cb8-97f3b890a597"
    },
    {
        "id": "d3ed2760-722a-451c-86ae-5fe472810571",
        "name": "Fruits Secs",
        "code": "FA021",
        "familyId": "216d6349-21cb-4e94-912f-7623a8e94519"
    },
    {
        "id": "92243936-293d-4589-b423-48963ee29ea0",
        "name": "Epices",
        "code": "FA022",
        "familyId": "216d6349-21cb-4e94-912f-7623a8e94519"
    },
    {
        "id": "a6cb29aa-c9d5-40dc-9c97-0441beee5faf",
        "name": "Divers",
        "code": "FA023",
        "familyId": "216d6349-21cb-4e94-912f-7623a8e94519"
    },
    {
        "id": "78d8d629-e3a8-4d1a-95b7-71b086c139a9",
        "name": "Lait",
        "code": "FA031",
        "familyId": "0b15b130-9b62-4b2a-9d90-36353d7119e2"
    },
    {
        "id": "d234e804-713a-4cbc-b785-8fbcf426a28b",
        "name": "Crème Fraîche",
        "code": "FA032",
        "familyId": "0b15b130-9b62-4b2a-9d90-36353d7119e2"
    },
    {
        "id": "dd8b321e-756b-4f41-abb4-7713e2d983e8",
        "name": "Beurre",
        "code": "FA033",
        "familyId": "0b15b130-9b62-4b2a-9d90-36353d7119e2"
    },
    {
        "id": "43a34283-8160-430e-b954-7fa3d1a51fe7",
        "name": "Fromage",
        "code": "FA034",
        "familyId": "0b15b130-9b62-4b2a-9d90-36353d7119e2"
    },
    {
        "id": "51d811e3-7c98-428a-a0bb-699e56a41419",
        "name": "Oeufs",
        "code": "FA041",
        "familyId": "a75017e4-8f9f-442a-9d8e-7369a4e9952a"
    },
    {
        "id": "40538854-552c-4db4-9231-c86bb4a47162",
        "name": "Fruits",
        "code": "FA042",
        "familyId": "a75017e4-8f9f-442a-9d8e-7369a4e9952a"
    },
    {
        "id": "79b6e603-af55-4f47-8178-af6e9d8848d1",
        "name": "Légumes",
        "code": "FA043",
        "familyId": "a75017e4-8f9f-442a-9d8e-7369a4e9952a"
    },
    {
        "id": "61b77289-f8d3-4f9e-9d8c-5afb7d733e56",
        "name": "Viandes Rouges",
        "code": "FA051",
        "familyId": "e88d0859-6df2-421b-867c-9b83f3e18a09"
    },
    {
        "id": "50594f03-ef8e-444e-90e7-a9ffe1fa7f6e",
        "name": "Volailles",
        "code": "FA052",
        "familyId": "e88d0859-6df2-421b-867c-9b83f3e18a09"
    },
    {
        "id": "664d5742-a8d9-4628-869b-c39ab0ca6abd",
        "name": "Poisson",
        "code": "FA053",
        "familyId": "e88d0859-6df2-421b-867c-9b83f3e18a09"
    },
    {
        "id": "294dec90-778d-497f-987a-df512351f201",
        "name": "Asiatique",
        "code": "FA054",
        "familyId": "e88d0859-6df2-421b-867c-9b83f3e18a09"
    },
    {
        "id": "ca50d6c7-1937-4fe9-91ee-10d87d3fd914",
        "name": "Chocolat",
        "code": "FA061",
        "familyId": "4e58b98b-7033-4f93-b6c8-6927361a4505"
    },
    {
        "id": "c901fbcc-c81b-4e3d-a73c-e784c79a4eda",
        "name": "Produits Pâtissiers",
        "code": "FA062",
        "familyId": "4e58b98b-7033-4f93-b6c8-6927361a4505"
    },
    {
        "id": "1c522fed-38a6-4209-a0bf-6034177238a0",
        "name": "Confiserie",
        "code": "FA063",
        "familyId": "4e58b98b-7033-4f93-b6c8-6927361a4505"
    },
    {
        "id": "5276435c-f44f-4b5c-adf8-05e7f26e6d05",
        "name": "Conserves Sucrés",
        "code": "FA064",
        "familyId": "4e58b98b-7033-4f93-b6c8-6927361a4505"
    },
    {
        "id": "b028cccf-c493-4300-8484-26d5a65e087d",
        "name": "Conserves Salés",
        "code": "FA065",
        "familyId": "4e58b98b-7033-4f93-b6c8-6927361a4505"
    },
    {
        "id": "c5029a80-3a5d-48d6-adf0-82b95253fbea",
        "name": "Cuisine 1",
        "code": "FA071",
        "familyId": "7a87e834-4536-4c8d-93cb-7183e9541a02"
    },
    {
        "id": "c6e1d47d-6366-43c2-ad52-26b36f11f286",
        "name": "Emballage Papier",
        "code": "FA081",
        "familyId": "d6b9e9c3-1f1d-4f1e-8e8e-1a1a1a1a1a1a"
    },
    {
        "id": "5f8710ad-44e4-402d-8c73-7208c60cd445",
        "name": "Emballage Carton",
        "code": "FA082",
        "familyId": "d6b9e9c3-1f1d-4f1e-8e8e-1a1a1a1a1a1a"
    },
    {
        "id": "dffe6985-3063-4b00-b14c-5e9753aa5d8c",
        "name": "Emballage Polystyrène",
        "code": "FA083",
        "familyId": "d6b9e9c3-1f1d-4f1e-8e8e-1a1a1a1a1a1a"
    },
    {
        "id": "ddbd1cd9-4274-420a-9bdf-42a3eab422d1",
        "name": "Consommable Emballage",
        "code": "FA086",
        "familyId": "d6b9e9c3-1f1d-4f1e-8e8e-1a1a1a1a1a1a"
    },
    {
        "id": "2ebee436-9abf-40e9-bfac-0fea225070f4",
        "name": "Eau / Electricité",
        "code": "FA093",
        "familyId": "b2a2b2a2-b2a2-4b2a-8b2a-2b2b2b2b2b2b"
    },
    {
        "id": "b4be2e12-50b3-442d-9604-94fa67da7b79",
        "name": "Téléphone",
        "code": "FA094",
        "familyId": "b2a2b2a2-b2a2-4b2a-8b2a-2b2b2b2b2b2b"
    },
    {
        "id": "069897d7-68a5-4495-bcba-59f6f7e7afd7",
        "name": "Fournitures Diverses",
        "code": "FA096",
        "familyId": "b2a2b2a2-b2a2-4b2a-8b2a-2b2b2b2b2b2b"
    },
    {
        "id": "1e653ee3-a49d-421e-9049-d6e8d7198ddf",
        "name": "Produits de Ménage",
        "code": "FA101",
        "familyId": "c3c3c3c3-c3c3-4c3c-8c3c-3c3c3c3c3c3c"
    },
    {
        "id": "9b357c7e-eaf5-4630-b6ab-8aea0e86cf5b",
        "name": "Service Hygiène",
        "code": "FA102",
        "familyId": "c3c3c3c3-c3c3-4c3c-8c3c-3c3c3c3c3c3c"
    },
    {
        "id": "246c9648-2966-4ca8-901e-b463dc782de9",
        "name": "Tenues de Personnel",
        "code": "FA103",
        "familyId": "c3c3c3c3-c3c3-4c3c-8c3c-3c3c3c3c3c3c"
    },
    {
        "id": "6eee1a9a-323f-455f-b37d-898cbaf72073",
        "name": "Gros Matériel",
        "code": "FA111",
        "familyId": "d4d4d4d4-d4d4-4d4d-8d4d-4d4d4d4d4d4d"
    },
    {
        "id": "c2fdc9f4-36bd-41ef-b521-5e740ef132bc",
        "name": "Petit Matériel",
        "code": "FA112",
        "familyId": "d4d4d4d4-d4d4-4d4d-8d4d-4d4d4d4d4d4d"
    },
    {
        "id": "8ab3d64c-dc32-40e4-8200-f4b2028a488f",
        "name": "Matériel Fours",
        "code": "FA113",
        "familyId": "d4d4d4d4-d4d4-4d4d-8d4d-4d4d4d4d4d4d"
    },
    {
        "id": "4df35035-333c-4bfa-af07-e7178f9fea2d",
        "name": "Matériel Froid",
        "code": "FA114",
        "familyId": "d4d4d4d4-d4d4-4d4d-8d4d-4d4d4d4d4d4d"
    },
    {
        "id": "abfcc1da-b0c0-4059-ac95-3f29fd61a2b2",
        "name": "Informatique / Bureautique",
        "code": "FA115",
        "familyId": "d4d4d4d4-d4d4-4d4d-8d4d-4d4d4d4d4d4d"
    },
    {
        "id": "c5384e0e-e867-46f7-b4c8-84e07304d642",
        "name": "Matériel Electrique",
        "code": "FA116",
        "familyId": "d4d4d4d4-d4d4-4d4d-8d4d-4d4d4d4d4d4d"
    },
    {
        "id": "593ce036-791a-4704-91a3-54a9d9964ee6",
        "name": "Matériel Plomberie",
        "code": "FA117",
        "familyId": "d4d4d4d4-d4d4-4d4d-8d4d-4d4d4d4d4d4d"
    },
    {
        "id": "2f5020c2-0b0b-4e71-9df6-c0c473011928",
        "name": "Loyer",
        "code": "FF011",
        "familyId": "6f822d16-5823-4e00-aee8-03a2248b1943"
    },
    {
        "id": "b0595e27-124e-475f-8ffc-ff1d1e3e0a1c",
        "name": "Assurance",
        "code": "FF012",
        "familyId": "6f822d16-5823-4e00-aee8-03a2248b1943"
    },
    {
        "id": "28b5c4f8-d84c-469a-94e3-9809f74c3476",
        "name": "Charges Ext Divers",
        "code": "FF013",
        "familyId": "6f822d16-5823-4e00-aee8-03a2248b1943"
    },
    {
        "id": "90c23a7b-8dd3-44f3-b05d-16a4e5d967ed",
        "name": "Salaires",
        "code": "FF021",
        "familyId": "e7f054f5-26ec-49de-bb75-8bdc27e01eeb"
    },
    {
        "id": "48957f84-fe1b-4c5b-bfa9-e37e5d047721",
        "name": "CNSS",
        "code": "FF022",
        "familyId": "e7f054f5-26ec-49de-bb75-8bdc27e01eeb"
    },
    {
        "id": "3a2cb702-ca82-41f3-a58d-3729cf5754a2",
        "name": "Compta",
        "code": "FF031",
        "familyId": "0b48e191-97f1-4816-96da-2a3bffdf543c"
    },
    {
        "id": "b8b0e934-ec9f-4bee-b666-851eb430b18b",
        "name": "Juridique",
        "code": "FF032",
        "familyId": "0b48e191-97f1-4816-96da-2a3bffdf543c"
    },
    {
        "id": "cb08e158-d333-4cca-9dd1-32ebc919b9f4",
        "name": "Honoraires Divers",
        "code": "FF033",
        "familyId": "0b48e191-97f1-4816-96da-2a3bffdf543c"
    },
    {
        "id": "ef24803f-ddde-4446-aafa-fd11f8a093ec",
        "name": "Imprimerie",
        "code": "FF041",
        "familyId": "4592ec30-2809-4745-9f63-4f5df3c9b9ec"
    },
    {
        "id": "f81c8562-adad-4367-8c37-6d49771ff3a4",
        "name": "Publicité",
        "code": "FF042",
        "familyId": "4592ec30-2809-4745-9f63-4f5df3c9b9ec"
    },
    {
        "id": "ca254945-b0ac-4c55-b361-fd2cd75eee0f",
        "name": "Communication",
        "code": "FF043",
        "familyId": "4592ec30-2809-4745-9f63-4f5df3c9b9ec"
    },
    {
        "id": "ff881782-48a0-4953-aeb4-e8ebc197e575",
        "name": "Réparation Machines",
        "code": "FF051",
        "familyId": "34034858-689c-4579-a656-041d27d76aff"
    },
    {
        "id": "1bc6dec8-e3fb-4412-93b8-4e83610b929a",
        "name": "Réparation Fours",
        "code": "FF052",
        "familyId": "34034858-689c-4579-a656-041d27d76aff"
    },
    {
        "id": "c5912572-75ba-47db-9f94-e5da93d3f551",
        "name": "Réparation Froid",
        "code": "FF053",
        "familyId": "34034858-689c-4579-a656-041d27d76aff"
    },
    {
        "id": "45094a5f-5513-4268-b62c-1dded64d1909",
        "name": "Travaux Maçonnerie",
        "code": "FF054",
        "familyId": "34034858-689c-4579-a656-041d27d76aff"
    },
    {
        "id": "d63c8c4c-d9fe-4a90-af68-0c13a9907f54",
        "name": "Travaux Electricité",
        "code": "FF055",
        "familyId": "34034858-689c-4579-a656-041d27d76aff"
    },
    {
        "id": "4d8f56b1-1602-49e8-9e06-0b0451d09e22",
        "name": "Travaux Plomberie",
        "code": "FF056",
        "familyId": "34034858-689c-4579-a656-041d27d76aff"
    },
    {
        "id": "90a83f3e-98f0-4459-9860-bd749b8b6d31",
        "name": "Maintenance Vitres",
        "code": "FF057",
        "familyId": "34034858-689c-4579-a656-041d27d76aff"
    },
    {
        "id": "cf0a7273-54c4-4871-a530-3b10936ba997",
        "name": "TVA",
        "code": "FF061",
        "familyId": "30709bc8-5329-4385-807c-4a5d387875b0"
    },
    {
        "id": "a5ded89f-3a8b-4b8a-9b05-d78408938a24",
        "name": "Frais de Timbre",
        "code": "FF062",
        "familyId": "30709bc8-5329-4385-807c-4a5d387875b0"
    },
    {
        "id": "5114d331-e83d-486f-ab19-39da1ef2f535",
        "name": "IS",
        "code": "FF063",
        "familyId": "30709bc8-5329-4385-807c-4a5d387875b0"
    },
    {
        "id": "3d033fd9-19e6-4980-85bc-c6d3aadc503f",
        "name": "Taxe Pro",
        "code": "FF064",
        "familyId": "30709bc8-5329-4385-807c-4a5d387875b0"
    },
    {
        "id": "f46e6a46-bce1-48df-864b-2da39c6e6573",
        "name": "IR Salarial",
        "code": "FF065",
        "familyId": "30709bc8-5329-4385-807c-4a5d387875b0"
    },
    {
        "id": "3eb2cc13-c207-482f-a783-6e1fa8b4bb6e",
        "name": "IR Locatif",
        "code": "FF066",
        "familyId": "30709bc8-5329-4385-807c-4a5d387875b0"
    },
    {
        "id": "253868c6-c3ee-4b46-9201-c523a238d4ec",
        "name": "Taxe d'Enseigne",
        "code": "FF067",
        "familyId": "30709bc8-5329-4385-807c-4a5d387875b0"
    },
    {
        "id": "ba365ada-929e-46c1-a5d0-80e4ea29c69e",
        "name": "Pains Beldi",
        "code": "FP011",
        "familyId": "51aad1c2-e759-432c-aeb8-ec97bcc68525"
    },
    {
        "id": "4c67edf6-4491-4fc0-899f-3a7904943bdb",
        "name": "Pains Tradition",
        "code": "FP012",
        "familyId": "51aad1c2-e759-432c-aeb8-ec97bcc68525"
    },
    {
        "id": "909f53da-aa41-4715-945d-9f5947ceaa41",
        "name": "Pains de Mie",
        "code": "FP013",
        "familyId": "51aad1c2-e759-432c-aeb8-ec97bcc68525"
    },
    {
        "id": "d84de02e-a09c-4a6c-8382-81333937554e",
        "name": "Croissants",
        "code": "FP021",
        "familyId": "1b43a7f4-2df0-49f5-9d85-a2b112e72211"
    },
    {
        "id": "4a3c0283-4413-4dc2-ac1b-8f06596bbf65",
        "name": "Brioches",
        "code": "FP022",
        "familyId": "1b43a7f4-2df0-49f5-9d85-a2b112e72211"
    },
    {
        "id": "2c2cd105-ecab-4977-86b6-1dcbc4b8a07a",
        "name": "Crois. Beldi",
        "code": "FP023",
        "familyId": "1b43a7f4-2df0-49f5-9d85-a2b112e72211"
    },
    {
        "id": "c1f6941a-1f63-4cfc-990f-afde0953b35a",
        "name": "Cakes & Cie",
        "code": "FP031",
        "familyId": "4aa3ac6d-bc22-42e4-88f2-3ec8d9ad0003"
    },
    {
        "id": "a820e2c1-201f-402e-b61a-338452c73076",
        "name": "Amandes & Cie",
        "code": "FP032",
        "familyId": "4aa3ac6d-bc22-42e4-88f2-3ec8d9ad0003"
    },
    {
        "id": "4214c42e-bd2a-46bd-b052-a118efbe2d86",
        "name": "Pommes & Cie",
        "code": "FP033",
        "familyId": "4aa3ac6d-bc22-42e4-88f2-3ec8d9ad0003"
    },
    {
        "id": "7ea8a7bb-dda7-4ec3-b66c-f7b3dab41d0c",
        "name": "Vienn. Beldi",
        "code": "FP034",
        "familyId": "4aa3ac6d-bc22-42e4-88f2-3ec8d9ad0003"
    },
    {
        "id": "ddc0b651-9425-4898-8bfc-ab570b46026d",
        "name": "Base 1",
        "code": "FP041",
        "familyId": "55f7f14b-5dbb-466c-a978-ca0bd93e94ee"
    },
    {
        "id": "8efd0aa1-09d1-49f8-8daf-e8a704b95794",
        "name": "Base 2",
        "code": "FP042",
        "familyId": "55f7f14b-5dbb-466c-a978-ca0bd93e94ee"
    },
    {
        "id": "cd965965-2449-418d-97af-4515afdd079c",
        "name": "Base 3",
        "code": "FP043",
        "familyId": "55f7f14b-5dbb-466c-a978-ca0bd93e94ee"
    },
    {
        "id": "f0e6cb01-196e-429b-8bca-604785afe632",
        "name": "Base 4",
        "code": "FP044",
        "familyId": "55f7f14b-5dbb-466c-a978-ca0bd93e94ee"
    },
    {
        "id": "9db3440f-505b-4fd2-97de-dca0a38a188a",
        "name": "Biscuits",
        "code": "FP051",
        "familyId": "ec45d049-bf9d-46f0-a14f-fdff51437564"
    },
    {
        "id": "1da313a7-2792-4d9e-a072-7befc13dfbbe",
        "name": "Crèmes & Mousses",
        "code": "FP052",
        "familyId": "ec45d049-bf9d-46f0-a14f-fdff51437564"
    },
    {
        "id": "9cc1764c-758f-4164-b33c-65c98bb20d19",
        "name": "Nougat & Craquant",
        "code": "FP053",
        "familyId": "ec45d049-bf9d-46f0-a14f-fdff51437564"
    },
    {
        "id": "757ef1ab-4c4f-4024-8d46-3f4cd6b5a927",
        "name": "Inserts",
        "code": "FP054",
        "familyId": "ec45d049-bf9d-46f0-a14f-fdff51437564"
    },
    {
        "id": "e66a3a6e-1d8f-4e5d-8451-caad97488129",
        "name": "Gâteaux",
        "code": "FP055",
        "familyId": "ec45d049-bf9d-46f0-a14f-fdff51437564"
    },
    {
        "id": "cd06f989-2e1c-4b5a-9a3e-3216b7a2ceec",
        "name": "Glaces",
        "code": "FP056",
        "familyId": "ec45d049-bf9d-46f0-a14f-fdff51437564"
    },
    {
        "id": "f0459401-7187-4b88-85c9-edb5ef1de797",
        "name": "Cuisine 1",
        "code": "FP061",
        "familyId": "f24640f4-e18c-4226-9296-db3c0204d972"
    },
    {
        "id": "94f7f4ef-0e49-4993-9654-280e95354e8f",
        "name": "Cuisine 2",
        "code": "FP062",
        "familyId": "f24640f4-e18c-4226-9296-db3c0204d972"
    },
    {
        "id": "380b39dc-8d3d-473e-a14b-dd070fe245f1",
        "name": "Cuisine 3",
        "code": "FP063",
        "familyId": "f24640f4-e18c-4226-9296-db3c0204d972"
    },
    {
        "id": "5efc4a2a-624e-4ed0-aab4-7bbadb1744c8",
        "name": "Cuisine 4",
        "code": "FP064",
        "familyId": "f24640f4-e18c-4226-9296-db3c0204d972"
    },
    {
        "id": "3fed041b-3d2a-49e8-a548-301c566a8d72",
        "name": "PF 1",
        "code": "FP071",
        "familyId": "05296b7b-9cc8-40ae-bbd5-d8428ee770b5"
    },
    {
        "id": "71ae224b-a7c1-40aa-b256-b9eea98e24ef",
        "name": "PF 2",
        "code": "FP072",
        "familyId": "05296b7b-9cc8-40ae-bbd5-d8428ee770b5"
    },
    {
        "id": "86f2013d-92c9-43ff-b153-835ce604dc3d",
        "name": "PF 3",
        "code": "FP073",
        "familyId": "05296b7b-9cc8-40ae-bbd5-d8428ee770b5"
    },
    {
        "id": "9c0a2464-c422-4276-8563-9003404110ec",
        "name": "PF 4",
        "code": "FP074",
        "familyId": "05296b7b-9cc8-40ae-bbd5-d8428ee770b5"
    },
    {
        "id": "ebb32ee6-4ab9-46ff-b57c-e3f32ecd17f7",
        "name": "Beldi 1",
        "code": "FP081",
        "familyId": "9927541a-b8ed-4e26-a4ee-ddcbd6599739"
    },
    {
        "id": "4d6d4389-6fe3-4c59-bcc3-60561916de16",
        "name": "Beldi 2",
        "code": "FP082",
        "familyId": "9927541a-b8ed-4e26-a4ee-ddcbd6599739"
    },
    {
        "id": "05ba3955-8ae9-40a1-b74c-dd3b8bbcb0fa",
        "name": "Beldi 3",
        "code": "FP083",
        "familyId": "9927541a-b8ed-4e26-a4ee-ddcbd6599739"
    },
    {
        "id": "823f8304-a7e6-4cd5-a6cc-1b62561dfff0",
        "name": "Beldi 4",
        "code": "FP084",
        "familyId": "9927541a-b8ed-4e26-a4ee-ddcbd6599739"
    },
    {
        "id": "ffbf588c-c0df-4d56-a8d5-10f46eb94730",
        "name": "SG 1",
        "code": "FP091",
        "familyId": "21e43beb-4e43-4a71-9ee3-e4b15b2197e1"
    },
    {
        "id": "a5f94a0a-0a3e-4b61-b7a8-2d55ebd8acce",
        "name": "SG 2",
        "code": "FP092",
        "familyId": "21e43beb-4e43-4a71-9ee3-e4b15b2197e1"
    },
    {
        "id": "c06e1c0f-be85-4b04-96af-1c25231dbfa6",
        "name": "SG 3",
        "code": "FP093",
        "familyId": "21e43beb-4e43-4a71-9ee3-e4b15b2197e1"
    },
    {
        "id": "4972683b-59bb-4cc4-ad60-b729f94375f9",
        "name": "SG 4",
        "code": "FP094",
        "familyId": "21e43beb-4e43-4a71-9ee3-e4b15b2197e1"
    },
    {
        "id": "eb414989-a587-4bb5-a5f1-9b6826950cd1",
        "name": "Boulangerie",
        "code": "FV011",
        "familyId": "64e059a2-3d8e-45d7-a9b9-08b77f816330"
    },
    {
        "id": "0350c66d-59ca-4ad4-a922-432de6cb058c",
        "name": "Croissanterie",
        "code": "FV021",
        "familyId": "17f18c0a-c3e8-4954-8455-50eee85282dd"
    },
    {
        "id": "cfb74983-bc57-483b-84f0-6b066daf65f3",
        "name": "Viennoiserie",
        "code": "FV022",
        "familyId": "17f18c0a-c3e8-4954-8455-50eee85282dd"
    },
    {
        "id": "bbd115f3-f929-4e60-855d-36cb4306399e",
        "name": "Individuels",
        "code": "FV031",
        "familyId": "5acde58e-a096-4358-b955-00eb470b907c"
    },
    {
        "id": "12bfe0de-5dad-4006-a6cc-05808d1cb94a",
        "name": "Entremets",
        "code": "FV032",
        "familyId": "5acde58e-a096-4358-b955-00eb470b907c"
    },
    {
        "id": "8a3936a0-5fa7-4ec2-bf69-893f95abf258",
        "name": "Fours Secs",
        "code": "FV041",
        "familyId": "0351124a-5bac-49eb-85f1-0b0ec1b08516"
    },
    {
        "id": "75d6dd52-9ef0-4da1-9026-d857cddcbca5",
        "name": "Beldi",
        "code": "FV042",
        "familyId": "0351124a-5bac-49eb-85f1-0b0ec1b08516"
    },
    {
        "id": "1884c0c2-5f3d-4a44-986e-91720fdf804f",
        "name": "Pré-Emballés",
        "code": "FV043",
        "familyId": "0351124a-5bac-49eb-85f1-0b0ec1b08516"
    },
    {
        "id": "7f8f26a0-b1ca-4b97-9622-cfcebc921eae",
        "name": "Salés",
        "code": "FV051",
        "familyId": "ee2e749e-0cc7-4da7-b604-c5c58100cfab"
    },
    {
        "id": "a730a9fc-b18f-4ec6-84f8-690c408504d1",
        "name": "Confiserie",
        "code": "FV061",
        "familyId": "95aa67b7-a47a-4ac5-a8fe-b594fc6faeb3"
    },
    {
        "id": "715d5618-1e77-4975-b351-5a3edf3c8e09",
        "name": "Pain SG",
        "code": "FV071",
        "familyId": "f6653a40-62f3-44c4-90c2-f73ba87a2e9d"
    },
    {
        "id": "cc6e8ff1-7ec7-49b8-9ad3-d2954ebf8243",
        "name": "Gâteaux SG",
        "code": "FV072",
        "familyId": "f6653a40-62f3-44c4-90c2-f73ba87a2e9d"
    },
    {
        "id": "da09171f-6e4e-4cd1-aaa3-ef129a07d964",
        "name": "Supp Traiteurs",
        "code": "FV081",
        "familyId": "0eb1d4b6-fe7d-4626-92c4-b193fdc6956c"
    },
    {
        "id": "a32f21d0-b3e5-4503-bca0-fade536d5a9c",
        "name": "Supp Caisse",
        "code": "FV082",
        "familyId": "0eb1d4b6-fe7d-4626-92c4-b193fdc6956c"
    }
];

export const initialArticles: Article[] = [
    {
        "id": "a1",
        "name": "Farine T45",
        "code": "FAR-T45",
        "subFamilyId": "0d580367-723b-4629-bc47-2145e6f8a105",
        "unitPivot": "Kg",
        "unitAchat": "Sac",
        "unitProduction": "g",
        "contenace": 25,
        "coeffProd": 1000,
        "vatRate": 20,
        "lastPivotPrice": 5.5,
        "accountingNature": "Achat de matières premières",
        "accountingCode": "6121",
        "priceHistory": []
    },
    {
        "id": "a2",
        "name": "Beurre Doux",
        "code": "BEU-DX",
        "subFamilyId": "dd8b321e-756b-4f41-abb4-7713e2d983e8",
        "unitPivot": "Kg",
        "unitAchat": "Carton",
        "unitProduction": "g",
        "contenace": 10,
        "coeffProd": 1000,
        "vatRate": 14,
        "lastPivotPrice": 92,
        "accountingNature": "Achat de matières premières",
        "accountingCode": "6121",
        "priceHistory": []
    },
    {
        "id": "PA101-01",
        "name": "Lessive Mains",
        "code": "PA101-01",
        "subFamilyId": "1e653ee3-a49d-421e-9049-d6e8d7198ddf",
        "unitAchat": "Unité",
        "unitPivot": "Unité",
        "unitProduction": "Unité",
        "contenace": 1,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Fournitures consommables",
        "accountingCode": "6122",
        "priceHistory": []
    },
    {
        "id": "PA101-02",
        "name": "Javel",
        "code": "PA101-02",
        "subFamilyId": "1e653ee3-a49d-421e-9049-d6e8d7198ddf",
        "unitAchat": "Unité",
        "unitPivot": "Unité",
        "unitProduction": "Unité",
        "contenace": 1,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Fournitures consommables",
        "accountingCode": "6122",
        "priceHistory": []
    },
    {
        "id": "PA101-03",
        "name": "Nettoyant Sol",
        "code": "PA101-03",
        "subFamilyId": "1e653ee3-a49d-421e-9049-d6e8d7198ddf",
        "unitAchat": "Unité",
        "unitPivot": "Unité",
        "unitProduction": "Unité",
        "contenace": 1,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Fournitures consommables",
        "accountingCode": "6122",
        "priceHistory": []
    },
    {
        "id": "PA101-04",
        "name": "ONI",
        "code": "PA101-04",
        "subFamilyId": "1e653ee3-a49d-421e-9049-d6e8d7198ddf",
        "unitAchat": "Unité",
        "unitPivot": "Unité",
        "unitProduction": "Unité",
        "contenace": 1,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Fournitures consommables",
        "accountingCode": "6122",
        "priceHistory": []
    },
    {
        "id": "PA101-05",
        "name": "Nettoyage Vitres",
        "code": "PA101-05",
        "subFamilyId": "1e653ee3-a49d-421e-9049-d6e8d7198ddf",
        "unitAchat": "Unité",
        "unitPivot": "Unité",
        "unitProduction": "Unité",
        "contenace": 1,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Fournitures consommables",
        "accountingCode": "6122",
        "priceHistory": []
    },
    {
        "id": "PA102-01",
        "name": "Entretien Egoûts",
        "code": "PA102-01",
        "subFamilyId": "9b357c7e-eaf5-4630-b6ab-8aea0e86cf5b",
        "unitAchat": "Unité",
        "unitPivot": "Unité",
        "unitProduction": "Unité",
        "contenace": 1,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Achats Non Stockés de matières et fournitures",
        "accountingCode": "6125",
        "priceHistory": []
    },
    {
        "id": "PA102-02",
        "name": "Laveur Vitres",
        "code": "PA102-02",
        "subFamilyId": "9b357c7e-eaf5-4630-b6ab-8aea0e86cf5b",
        "unitAchat": "Unité",
        "unitPivot": "Unité",
        "unitProduction": "Unité",
        "contenace": 1,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Achats Non Stockés de matières et fournitures",
        "accountingCode": "6125",
        "priceHistory": []
    },
    {
        "id": "PA103-01",
        "name": "Chemises vendeuses",
        "code": "PA103-01",
        "subFamilyId": "246c9648-2966-4ca8-901e-b463dc782de9",
        "unitAchat": "Unité",
        "unitPivot": "Unité",
        "unitProduction": "Unité",
        "contenace": 1,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Fournitures consommables",
        "accountingCode": "6122",
        "priceHistory": []
    },
    {
        "id": "PA086-01",
        "name": "Papier Cuisson",
        "code": "PA086-01",
        "subFamilyId": "ddbd1cd9-4274-420a-9bdf-42a3eab422d1",
        "unitAchat": "Boite",
        "unitPivot": "Feuilles",
        "unitProduction": "Feuilles",
        "contenace": 100,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Achat d'emballages",
        "accountingCode": "6123",
        "priceHistory": []
    },
    {
        "id": "PA086-02",
        "name": "Tourtière Diam 28",
        "code": "PA086-02",
        "subFamilyId": "ddbd1cd9-4274-420a-9bdf-42a3eab422d1",
        "unitAchat": "Carton",
        "unitPivot": "Unités",
        "unitProduction": "Unités",
        "contenace": 100,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Achat d'emballages",
        "accountingCode": "6123",
        "priceHistory": []
    },
    {
        "id": "PA086-03",
        "name": "Tulipes MM",
        "code": "PA086-03",
        "subFamilyId": "ddbd1cd9-4274-420a-9bdf-42a3eab422d1",
        "unitAchat": "Carton",
        "unitPivot": "Unités",
        "unitProduction": "Unités",
        "contenace": 100,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Achat d'emballages",
        "accountingCode": "6123",
        "priceHistory": []
    },
    {
        "id": "PA086-04",
        "name": "Caissettes Fondant",
        "code": "PA086-04",
        "subFamilyId": "ddbd1cd9-4274-420a-9bdf-42a3eab422d1",
        "unitAchat": "Carton",
        "unitPivot": "Unités",
        "unitProduction": "Unités",
        "contenace": 100,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Achat d'emballages",
        "accountingCode": "6123",
        "priceHistory": []
    },
    {
        "id": "PA086-05",
        "name": "Caissettes N° 60*25",
        "code": "PA086-05",
        "subFamilyId": "ddbd1cd9-4274-420a-9bdf-42a3eab422d1",
        "unitAchat": "Carton",
        "unitPivot": "Unités",
        "unitProduction": "Unités",
        "contenace": 100,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Achat d'emballages",
        "accountingCode": "6123",
        "priceHistory": []
    },
    {
        "id": "PA086-06",
        "name": "Caissettes N° 3",
        "code": "PA086-06",
        "subFamilyId": "ddbd1cd9-4274-420a-9bdf-42a3eab422d1",
        "unitAchat": "Carton",
        "unitPivot": "Unités",
        "unitProduction": "Unités",
        "contenace": 100,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Achat d'emballages",
        "accountingCode": "6123",
        "priceHistory": []
    },
    {
        "id": "PA086-07",
        "name": "Feuille Polypro 15*12",
        "code": "PA086-07",
        "subFamilyId": "ddbd1cd9-4274-420a-9bdf-42a3eab422d1",
        "unitAchat": "Paquet",
        "unitPivot": "Feuilles",
        "unitProduction": "Feuilles",
        "contenace": 100,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Achat d'emballages",
        "accountingCode": "6123",
        "priceHistory": []
    },
    {
        "id": "PA086-08",
        "name": "Poches Jetables",
        "code": "PA086-08",
        "subFamilyId": "ddbd1cd9-4274-420a-9bdf-42a3eab422d1",
        "unitAchat": "Unité",
        "unitPivot": "Unité",
        "unitProduction": "Unité",
        "contenace": 1,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Achat d'emballages",
        "accountingCode": "6123",
        "priceHistory": []
    },
    {
        "id": "PA086-11",
        "name": "Papier Aluminium",
        "code": "PA086-11",
        "subFamilyId": "ddbd1cd9-4274-420a-9bdf-42a3eab422d1",
        "unitAchat": "Unité",
        "unitPivot": "Unité",
        "unitProduction": "Unité",
        "contenace": 1,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Achat d'emballages",
        "accountingCode": "6123",
        "priceHistory": []
    },
    {
        "id": "PA086-21",
        "name": "Ficelle Bordeaux",
        "code": "PA086-21",
        "subFamilyId": "ddbd1cd9-4274-420a-9bdf-42a3eab422d1",
        "unitAchat": "Unité",
        "unitPivot": "Unité",
        "unitProduction": "Unité",
        "contenace": 1,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Achat d'emballages",
        "accountingCode": "6123",
        "priceHistory": []
    },
    {
        "id": "PA086-22",
        "name": "Scotch",
        "code": "PA086-22",
        "subFamilyId": "ddbd1cd9-4274-420a-9bdf-42a3eab422d1",
        "unitAchat": "Unité",
        "unitPivot": "Unité",
        "unitProduction": "Unité",
        "contenace": 1,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Achat d'emballages",
        "accountingCode": "6123",
        "priceHistory": []
    },
    {
        "id": "PA086-23",
        "name": "Gants Jetables",
        "code": "PA086-23",
        "subFamilyId": "ddbd1cd9-4274-420a-9bdf-42a3eab422d1",
        "unitAchat": "Unité",
        "unitPivot": "Unité",
        "unitProduction": "Unité",
        "contenace": 1,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Achat d'emballages",
        "accountingCode": "6123",
        "priceHistory": []
    },
    {
        "id": "PA086-24",
        "name": "Cuillères",
        "code": "PA086-24",
        "subFamilyId": "ddbd1cd9-4274-420a-9bdf-42a3eab422d1",
        "unitAchat": "Unité",
        "unitPivot": "Unité",
        "unitProduction": "Unité",
        "contenace": 1,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Achat d'emballages",
        "accountingCode": "6123",
        "priceHistory": []
    },
    {
        "id": "PA086-25",
        "name": "Rouleau caisse",
        "code": "PA086-25",
        "subFamilyId": "ddbd1cd9-4274-420a-9bdf-42a3eab422d1",
        "unitAchat": "Unité",
        "unitPivot": "Unité",
        "unitProduction": "Unité",
        "contenace": 1,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Achat d'emballages",
        "accountingCode": "6123",
        "priceHistory": []
    },
    {
        "id": "PA086-31",
        "name": "Bougies 1 an",
        "code": "PA086-31",
        "subFamilyId": "ddbd1cd9-4274-420a-9bdf-42a3eab422d1",
        "unitAchat": "Unité",
        "unitPivot": "Unité",
        "unitProduction": "Unité",
        "contenace": 1,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Achat d'emballages",
        "accountingCode": "6123",
        "priceHistory": []
    },
    {
        "id": "PA086-32",
        "name": "Bougies 10 ans",
        "code": "PA086-32",
        "subFamilyId": "ddbd1cd9-4274-420a-9bdf-42a3eab422d1",
        "unitAchat": "Unité",
        "unitPivot": "Unité",
        "unitProduction": "Unité",
        "contenace": 1,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Achat d'emballages",
        "accountingCode": "6123",
        "priceHistory": []
    },
    {
        "id": "PA086-33",
        "name": "Support de Bougies",
        "code": "PA086-33",
        "subFamilyId": "ddbd1cd9-4274-420a-9bdf-42a3eab422d1",
        "unitAchat": "Unité",
        "unitPivot": "Unité",
        "unitProduction": "Unité",
        "contenace": 1,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Achat d'emballages",
        "accountingCode": "6123",
        "priceHistory": []
    },
    {
        "id": "PA086-34",
        "name": "Fèves",
        "code": "PA086-34",
        "subFamilyId": "ddbd1cd9-4274-420a-9bdf-42a3eab422d1",
        "unitAchat": "Unité",
        "unitPivot": "Unité",
        "unitProduction": "Unité",
        "contenace": 1,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Achat d'emballages",
        "accountingCode": "6123",
        "priceHistory": []
    },
    {
        "id": "PA086-35",
        "name": "Couronnes",
        "code": "PA086-35",
        "subFamilyId": "ddbd1cd9-4274-420a-9bdf-42a3eab422d1",
        "unitAchat": "Unité",
        "unitPivot": "Unité",
        "unitProduction": "Unité",
        "contenace": 1,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Achat d'emballages",
        "accountingCode": "6123",
        "priceHistory": []
    },
    {
        "id": "PA086-36",
        "name": "Sujets Noel",
        "code": "PA086-36",
        "subFamilyId": "ddbd1cd9-4274-420a-9bdf-42a3eab422d1",
        "unitAchat": "Unité",
        "unitPivot": "Unité",
        "unitProduction": "Unité",
        "contenace": 1,
        "coeffProd": 1,
        "vatRate": 20,
        "accountingNature": "Achat d'emballages",
        "accountingCode": "6123",
        "priceHistory": []
    }
];

export const initialUnits = ["Kg", "Litre", "Unité", "Carton", "Quintal", "Sac", "Palette", "Plateau", "Barquette", "Boite"];
