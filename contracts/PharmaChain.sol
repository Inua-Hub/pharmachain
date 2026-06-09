// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PharmaChain {
    struct Medicine {
        string name;
        string batchNo;
        string manufacturer;
        uint256 price;
        uint256 timestamp;
        bool exists;
        bool isValid;
        address createdBy;
    }
    
    mapping(string => Medicine) public medicines;
    mapping(address => bool) public authorizedManufacturers;
    uint256 public totalMedicines;
    
    event MedicineCreated(
        string indexed batchNo,
        string name,
        string manufacturer,
        uint256 price,
        uint256 timestamp,
        address indexed creator
    );
    
    event MedicineVerified(
        string indexed batchNo,
        bool isValid,
        address indexed verifier
    );
    
    event ManufacturerAdded(address indexed manufacturer);
    
    constructor() {
        authorizedManufacturers[msg.sender] = true;
    }
    
    function addManufacturer(address _manufacturer) public {
        require(authorizedManufacturers[msg.sender], "Not authorized");
        authorizedManufacturers[_manufacturer] = true;
        emit ManufacturerAdded(_manufacturer);
    }
    
    function createMedicine(
        string memory _name,
        string memory _batchNo,
        string memory _manufacturer,
        uint256 _price
    ) public returns (bytes32) {
        require(authorizedManufacturers[msg.sender], "Only authorized manufacturers");
        require(!medicines[_batchNo].exists, "Medicine already exists");
        
        medicines[_batchNo] = Medicine({
            name: _name,
            batchNo: _batchNo,
            manufacturer: _manufacturer,
            price: _price,
            timestamp: block.timestamp,
            exists: true,
            isValid: true,
            createdBy: msg.sender
        });
        
        totalMedicines++;
        
        emit MedicineCreated(_batchNo, _name, _manufacturer, _price, block.timestamp, msg.sender);
        
        return keccak256(abi.encodePacked(_batchNo, block.timestamp, msg.sender));
    }
    
    function verifyMedicine(string memory _batchNo) public view returns (
        string memory name,
        string memory manufacturer,
        uint256 price,
        uint256 timestamp,
        bool isValid,
        address createdBy
    ) {
        Medicine memory med = medicines[_batchNo];
        require(med.exists, "Medicine not found on blockchain");
        
        return (
            med.name,
            med.manufacturer,
            med.price,
            med.timestamp,
            med.isValid,
            med.createdBy
        );
    }
    
    function isMedicineValid(string memory _batchNo) public view returns (bool) {
        return medicines[_batchNo].exists && medicines[_batchNo].isValid;
    }
    
    function getMedicineCount() public view returns (uint256) {
        return totalMedicines;
    }
}
