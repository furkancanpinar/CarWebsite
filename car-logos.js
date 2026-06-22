// car-logos.js — Car brand logos via Wikipedia CDN

export const carLogos = {
  'BMW': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/BMW_logo_%28gray%29.svg/204px-BMW_logo_%28gray%29.svg.png',
  'Tesla': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Tesla_Motors.svg/200px-Tesla_Motors.svg.png',
  'Audi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Audi-Logo_2019.svg/200px-Audi-Logo_2019.svg.png',
  'Porsche': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Porsche_logo.svg/200px-Porsche_logo.svg.png',
  'Mercedes': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Mercedes-Benz_Logo_2011.svg/200px-Mercedes-Benz_Logo_2011.svg.png',
  'Mercedes-Benz': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Mercedes-Benz_Logo_2011.svg/200px-Mercedes-Benz_Logo_2011.svg.png',
  'Land Rover': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Land_Rover_logo.svg/200px-Land_Rover_logo.svg.png',
  'Range Rover': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Land_Rover_logo.svg/200px-Land_Rover_logo.svg.png',
  'Toyota': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Toyota_carlogo.svg/200px-Toyota_carlogo.svg.png',
  'Honda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Honda.svg/200px-Honda.svg.png',
  'Ford': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Ford_logo_flat.svg/200px-Ford_logo_flat.svg.png',
  'Volkswagen': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Volkswagen_logo_2019.svg/200px-Volkswagen_logo_2019.svg.png',
  'VW': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Volkswagen_logo_2019.svg/200px-Volkswagen_logo_2019.svg.png',
  'Bentley': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Bentley_Motors_Limited_logo.svg/200px-Bentley_Motors_Limited_logo.svg.png',
  'Lamborghini': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Lamborghini_Logo.svg/200px-Lamborghini_Logo.svg.png',
  'Ferrari': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Scuderia_Ferrari_Logo.svg/200px-Scuderia_Ferrari_Logo.svg.png',
  'Rolls Royce': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Rolls-Royce_Motor_Cars_logo.svg/200px-Rolls-Royce_Motor_Cars_logo.svg.png',
  'Rolls-Royce': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Rolls-Royce_Motor_Cars_logo.svg/200px-Rolls-Royce_Motor_Cars_logo.svg.png',
  'Maserati': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Maserati_logo.svg/200px-Maserati_logo.svg.png',
  'McLaren': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/McLaren_logo.svg/200px-McLaren_logo.svg.png',
  'Bugatti': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Bugatti_logo.svg/200px-Bugatti_logo.svg.png',
  'Aston Martin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Aston_Martin_logo.svg/200px-Aston_Martin_logo.svg.png',
  'Jaguar': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Jaguar_logo.svg/200px-Jaguar_logo.svg.png',
  'Volvo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Volvo_iron_mark.svg/200px-Volvo_iron_mark.svg.png',
  'Mazda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Mazda_logo.svg/200px-Mazda_logo.svg.png',
  'Nissan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Nissan_logo.svg/200px-Nissan_logo.svg.png',
  'Hyundai': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Hyundai_Motor_Company_logo.svg/200px-Hyundai_Motor_Company_logo.svg.png',
  'Kia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Kia_logo.svg/200px-Kia_logo.svg.png',
  'Subaru': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Subaru_logo.svg/200px-Subaru_logo.svg.png',
  'Lexus': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Lexus_division_logo.svg/200px-Lexus_division_logo.svg.png'
};

export function getCarLogo(make) {
  if (!make) return null;
  return carLogos[make] || carLogos[make.toLowerCase()] || carLogos[make.toUpperCase()] || null;
}
