export interface IrelandPlace {
  name: string;
  latitude: number;
  longitude: number;
}

export interface IrelandCounty {
  name: string;
  places: IrelandPlace[];
}

/** Major Irish counties and towns for manual location selection. */
export const IRELAND_COUNTIES: IrelandCounty[] = [
  {
    name: 'Dublin',
    places: [
      { name: 'Dublin City', latitude: 53.3498, longitude: -6.2603 },
      { name: 'Dundrum', latitude: 53.2897, longitude: -6.243 },
      { name: 'Sandyford', latitude: 53.2747, longitude: -6.2253 },
      { name: 'Goatstown', latitude: 53.2858, longitude: -6.2269 },
      { name: 'Tallaght', latitude: 53.2859, longitude: -6.3733 },
      { name: 'Swords', latitude: 53.4597, longitude: -6.2181 },
      { name: 'Blanchardstown', latitude: 53.3928, longitude: -6.3756 },
      { name: 'Dún Laoghaire', latitude: 53.2938, longitude: -6.1359 },
    ],
  },
  {
    name: 'Cork',
    places: [
      { name: 'Cork City', latitude: 51.8985, longitude: -8.4756 },
      { name: 'Douglas', latitude: 51.8764, longitude: -8.436 },
      { name: 'Ballincollig', latitude: 51.8879, longitude: -8.5886 },
      { name: 'Bishopstown', latitude: 51.8847, longitude: -8.5322 },
      { name: 'Carrigaline', latitude: 51.8117, longitude: -8.3986 },
      { name: 'Midleton', latitude: 51.9153, longitude: -8.1752 },
    ],
  },
  {
    name: 'Galway',
    places: [
      { name: 'Galway City', latitude: 53.2707, longitude: -9.0568 },
      { name: 'Salthill', latitude: 53.261, longitude: -9.0787 },
      { name: 'Oranmore', latitude: 53.2683, longitude: -8.9199 },
      { name: 'Knocknacarra', latitude: 53.2656, longitude: -9.1089 },
      { name: 'Tuam', latitude: 53.5147, longitude: -8.8564 },
    ],
  },
  {
    name: 'Donegal',
    places: [
      { name: 'Letterkenny', latitude: 54.953, longitude: -7.734 },
      { name: 'Buncrana', latitude: 55.1356, longitude: -7.4556 },
      { name: 'Ballybofey', latitude: 54.8, longitude: -7.7833 },
      { name: 'Donegal Town', latitude: 54.6535, longitude: -8.1096 },
    ],
  },
  {
    name: 'Limerick',
    places: [
      { name: 'Limerick City', latitude: 52.6638, longitude: -8.6267 },
      { name: 'Castletroy', latitude: 52.6714, longitude: -8.5625 },
      { name: 'Dooradoyle', latitude: 52.6378, longitude: -8.6489 },
      { name: 'Newcastle West', latitude: 52.4497, longitude: -9.0614 },
    ],
  },
  {
    name: 'Kerry',
    places: [
      { name: 'Tralee', latitude: 52.2713, longitude: -9.7026 },
      { name: 'Killarney', latitude: 52.0599, longitude: -9.5044 },
      { name: 'Listowel', latitude: 52.4469, longitude: -9.4856 },
    ],
  },
  {
    name: 'Waterford',
    places: [
      { name: 'Waterford City', latitude: 52.2593, longitude: -7.1101 },
      { name: 'Tramore', latitude: 52.1619, longitude: -7.1447 },
      { name: 'Dungarvan', latitude: 52.0881, longitude: -7.6253 },
    ],
  },
  {
    name: 'Wicklow',
    places: [
      { name: 'Bray', latitude: 53.2028, longitude: -6.0983 },
      { name: 'Greystones', latitude: 53.1442, longitude: -6.0631 },
      { name: 'Arklow', latitude: 52.7942, longitude: -6.1497 },
    ],
  },
  {
    name: 'Kildare',
    places: [
      { name: 'Naas', latitude: 53.2157, longitude: -6.6661 },
      { name: 'Newbridge', latitude: 53.1819, longitude: -6.7967 },
      { name: 'Maynooth', latitude: 53.3832, longitude: -6.5936 },
    ],
  },
  {
    name: 'Meath',
    places: [
      { name: 'Navan', latitude: 53.6528, longitude: -6.6814 },
      { name: 'Ashbourne', latitude: 53.5117, longitude: -6.3983 },
      { name: 'Trim', latitude: 53.555, longitude: -6.7917 },
    ],
  },
  {
    name: 'Louth',
    places: [
      { name: 'Drogheda', latitude: 53.7189, longitude: -6.3478 },
      { name: 'Dundalk', latitude: 54.0, longitude: -6.4167 },
    ],
  },
  {
    name: 'Mayo',
    places: [
      { name: 'Castlebar', latitude: 53.8558, longitude: -9.2981 },
      { name: 'Ballina', latitude: 54.1144, longitude: -9.1525 },
      { name: 'Westport', latitude: 53.8, longitude: -9.5167 },
    ],
  },
  {
    name: 'Clare',
    places: [
      { name: 'Ennis', latitude: 52.8436, longitude: -8.9864 },
      { name: 'Shannon', latitude: 52.7039, longitude: -8.8642 },
    ],
  },
  {
    name: 'Tipperary',
    places: [
      { name: 'Clonmel', latitude: 52.3558, longitude: -7.7039 },
      { name: 'Nenagh', latitude: 52.8619, longitude: -8.1967 },
      { name: 'Thurles', latitude: 52.6797, longitude: -7.8142 },
    ],
  },
  {
    name: 'Wexford',
    places: [
      { name: 'Wexford Town', latitude: 52.3369, longitude: -6.4633 },
      { name: 'Enniscorthy', latitude: 52.5028, longitude: -6.5656 },
    ],
  },
  {
    name: 'Kilkenny',
    places: [{ name: 'Kilkenny City', latitude: 52.6541, longitude: -7.2448 }],
  },
  {
    name: 'Westmeath',
    places: [
      { name: 'Athlone', latitude: 53.4239, longitude: -7.9406 },
      { name: 'Mullingar', latitude: 53.5256, longitude: -7.3389 },
    ],
  },
  {
    name: 'Offaly',
    places: [
      { name: 'Tullamore', latitude: 53.2739, longitude: -7.4889 },
      { name: 'Birr', latitude: 53.095, longitude: -7.9133 },
    ],
  },
  {
    name: 'Laois',
    places: [{ name: 'Portlaoise', latitude: 53.0344, longitude: -7.2997 }],
  },
  {
    name: 'Carlow',
    places: [{ name: 'Carlow Town', latitude: 52.8408, longitude: -6.9261 }],
  },
  {
    name: 'Sligo',
    places: [{ name: 'Sligo Town', latitude: 54.2766, longitude: -8.4761 }],
  },
  {
    name: 'Roscommon',
    places: [{ name: 'Roscommon Town', latitude: 53.6333, longitude: -8.1833 }],
  },
  {
    name: 'Leitrim',
    places: [{ name: 'Carrick-on-Shannon', latitude: 53.9461, longitude: -8.0897 }],
  },
  {
    name: 'Longford',
    places: [{ name: 'Longford Town', latitude: 53.7275, longitude: -7.7981 }],
  },
  {
    name: 'Cavan',
    places: [{ name: 'Cavan Town', latitude: 53.9908, longitude: -7.3606 }],
  },
  {
    name: 'Monaghan',
    places: [{ name: 'Monaghan Town', latitude: 54.2478, longitude: -6.9708 }],
  },
];

export const USER_LOCATION_STORAGE_KEY = 'cm-user-location';
