function LocationSelector({
  state,
  district,
  setState,
  setDistrict,
}) {
  const states = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ];

  const districts = {
    "Andhra Pradesh": ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "Nellore", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari"],
    "Arunachal Pradesh": ["Tawang", "Itanagar"],
    "Assam": ["Guwahati", "Dibrugarh", "Jorhat", "Silchar", "Tezpur", "Nagaon"],
    "Bihar": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga", "Purnia"],
    "Chhattisgarh": ["Raipur", "Bilaspur", "Durg", "Korba", "Rajnandgaon", "Jagdalpur"],
    "Goa": ["North Goa", "South Goa"],
    "Gujarat": ["Ahmedabad", "Surat", "Rajkot", "Vadodara", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Bharuch"],
    "Haryana": ["Gurugram", "Hisar", "Rohtak", "Panipat", "Karnal", "Ambala", "Faridabad", "Sonipat"],
    "Himachal Pradesh": ["Shimla", "Dharamshala", "Mandi", "Solan", "Kullu"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh"],
    "Karnataka": ["Bengaluru", "Mysuru", "Belagavi", "Hubballi", "Mangaluru", "Davangere", "Ballari", "Kalaburagi"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Alappuzha"],
    "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Satna", "Rewa", "Ratlam", "Khandwa"],
    "Maharashtra": ["Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Sangli", "Amravati", "Ahmednagar", "Jalgaon", "Akola", "Latur", "Dhule"],
    "Manipur": ["Imphal"],
    "Meghalaya": ["Shillong"],
    "Mizoram": ["Aizawl"],
    "Nagaland": ["Kohima", "Dimapur"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Puri", "Sambalpur", "Rourkela", "Berhampur"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Alwar", "Bhilwara", "Sikar", "Bharatpur"],
    "Sikkim": ["Gangtok", "Namchi"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli", "Tiruppur", "Erode", "Vellore", "Thoothukudi"],
    "Telangana": ["Hyderabad", "Warangal", "Karimnagar", "Khammam", "Nizamabad", "Mahbubnagar"],
    "Tripura": ["Agartala"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Prayagraj", "Agra", "Meerut", "Gorakhpur", "Bareilly", "Aligarh", "Moradabad", "Saharanpur", "Jhansi"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Nainital", "Almora", "Roorkee", "Haldwani"],
    "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Darjeeling", "Malda", "Murshidabad", "Nadia"],
  };

  return (
    <div className="grid gap-5 md:grid-cols-2">

      <div>
        <label className="mb-2 block text-sm text-gray-400">
          State
        </label>

        <select
          value={state}
          onChange={(e) => {
            setState(e.target.value);
            setDistrict("");
          }}
          className="w-full rounded-2xl border border-white/10 bg-[#071711] px-4 py-4 text-sm text-white outline-none focus:border-emerald-400/50"
        >
          <option value="">Select State</option>

          {states.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm text-gray-400">
          District
        </label>

        <select
          value={district}
          disabled={!state}
          onChange={(e) => setDistrict(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-[#071711] px-4 py-4 text-sm text-white outline-none focus:border-emerald-400/50 disabled:opacity-40"
        >
          <option value="">Select District</option>

          {state &&
            districts[state]?.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
        </select>
      </div>

    </div>
  );
}

export default LocationSelector;