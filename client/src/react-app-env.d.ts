/// <reference types="react-scripts" />
interface Circle {
  id:          string;
  circle_name: string;
  penname:     string;
  space_sym:   string;
  space_num:   number;
  samplebook?: boolean;
  isRefreshed?: boolean;
}

interface Exhibition {
  id:               string;
  exhibition_name:  string;
}
