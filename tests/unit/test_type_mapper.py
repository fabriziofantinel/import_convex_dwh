"""
Unit tests per Type Mapper
"""
import pytest
import json
from src.sql import TypeMapper


class TestTypeMapper:
    """Test per la classe TypeMapper"""
    
    def test_map_string_to_sql(self):
        """Test mappatura tipo string"""
        mapper = TypeMapper()
        assert mapper.map_convex_to_sql('string') == 'NVARCHAR(MAX)'
    
    def test_map_number_to_sql(self):
        """Test mappatura tipo number"""
        mapper = TypeMapper()
        assert mapper.map_convex_to_sql('number') == 'FLOAT'
    
    def test_map_boolean_to_sql(self):
        """Test mappatura tipo boolean"""
        mapper = TypeMapper()
        assert mapper.map_convex_to_sql('boolean') == 'BIT'
    
    def test_map_null_to_sql(self):
        """Test mappatura tipo null"""
        mapper = TypeMapper()
        assert mapper.map_convex_to_sql('null') == 'NULL'
    
    def test_map_id_to_sql(self):
        """Test mappatura tipo id"""
        mapper = TypeMapper()
        assert mapper.map_convex_to_sql('id') == 'NVARCHAR(50)'
    
    def test_map_array_to_sql(self):
        """Test mappatura tipo array"""
        mapper = TypeMapper()
        assert mapper.map_convex_to_sql('array') == 'NVARCHAR(MAX)'
    
    def test_map_object_to_sql(self):
        """Test mappatura tipo object"""
        mapper = TypeMapper()
        assert mapper.map_convex_to_sql('object') == 'NVARCHAR(MAX)'
    
    def test_map_unsupported_type_raises_error(self):
        """Test che tipo non supportato sollevi errore"""
        mapper = TypeMapper()
        with pytest.raises(ValueError, match="Unsupported Convex type"):
            mapper.map_convex_to_sql('unknown_type')
    
    def test_convert_string_value(self):
        """Test conversione valore string"""
        mapper = TypeMapper()
        result = mapper.convert_value('hello', 'string')
        assert result == 'hello'
        assert isinstance(result, str)
    
    def test_convert_number_value(self):
        """Test conversione valore number"""
        mapper = TypeMapper()
        result = mapper.convert_value(42, 'number')
        assert result == 42.0
        assert isinstance(result, float)
    
    def test_convert_boolean_value_true(self):
        """Test conversione valore boolean True"""
        mapper = TypeMapper()
        result = mapper.convert_value(True, 'boolean')
        assert result is True
        assert isinstance(result, bool)
    
    def test_convert_boolean_value_false(self):
        """Test conversione valore boolean False"""
        mapper = TypeMapper()
        result = mapper.convert_value(False, 'boolean')
        assert result is False
        assert isinstance(result, bool)
    
    def test_convert_null_value(self):
        """Test conversione valore null"""
        mapper = TypeMapper()
        result = mapper.convert_value(None, 'null')
        assert result is None
    
    def test_convert_id_value(self):
        """Test conversione valore id"""
        mapper = TypeMapper()
        result = mapper.convert_value('abc123def456', 'id')
        assert result == 'abc123def456'
        assert isinstance(result, str)
    
    def test_convert_array_value(self):
        """Test conversione valore array a JSON"""
        mapper = TypeMapper()
        array_value = [1, 2, 3, 'test']
        result = mapper.convert_value(array_value, 'array')
        assert isinstance(result, str)
        assert json.loads(result) == array_value
    
    def test_convert_object_value(self):
        """Test conversione valore object a JSON"""
        mapper = TypeMapper()
        object_value = {'name': 'John', 'age': 30, 'active': True}
        result = mapper.convert_value(object_value, 'object')
        assert isinstance(result, str)
        assert json.loads(result) == object_value
    
    def test_convert_none_value_any_type(self):
        """Test che None ritorni None per qualsiasi tipo"""
        mapper = TypeMapper()
        assert mapper.convert_value(None, 'string') is None
        assert mapper.convert_value(None, 'number') is None
        assert mapper.convert_value(None, 'boolean') is None
    
    def test_convert_unsupported_type_raises_error(self):
        """Test che tipo non supportato sollevi errore"""
        mapper = TypeMapper()
        with pytest.raises(ValueError, match="Unsupported Convex type"):
            mapper.convert_value('value', 'unknown_type')
    
    def test_infer_type_from_none(self):
        """Test inferenza tipo da None"""
        mapper = TypeMapper()
        assert mapper.infer_convex_type(None) == 'null'
    
    def test_infer_type_from_boolean(self):
        """Test inferenza tipo da boolean"""
        mapper = TypeMapper()
        assert mapper.infer_convex_type(True) == 'boolean'
        assert mapper.infer_convex_type(False) == 'boolean'
    
    def test_infer_type_from_number(self):
        """Test inferenza tipo da number"""
        mapper = TypeMapper()
        assert mapper.infer_convex_type(42) == 'number'
        assert mapper.infer_convex_type(3.14) == 'number'
    
    def test_infer_type_from_string(self):
        """Test inferenza tipo da string"""
        mapper = TypeMapper()
        assert mapper.infer_convex_type('hello') == 'string'
    
    def test_infer_type_from_id(self):
        """Test inferenza tipo da id (16 caratteri alfanumerici)"""
        mapper = TypeMapper()
        assert mapper.infer_convex_type('abc123def4567890') == 'id'
    
    def test_infer_type_from_list(self):
        """Test inferenza tipo da list"""
        mapper = TypeMapper()
        assert mapper.infer_convex_type([1, 2, 3]) == 'array'
    
    def test_infer_type_from_dict(self):
        """Test inferenza tipo da dict"""
        mapper = TypeMapper()
        assert mapper.infer_convex_type({'key': 'value'}) == 'object'
    
    def test_get_table_schema_sql_simple(self):
        """Test generazione SQL CREATE TABLE semplice"""
        mapper = TypeMapper()
        schema = {
            'id': 'id',
            'name': 'string',
            'age': 'number',
            'active': 'boolean'
        }
        
        sql = mapper.get_table_schema_sql('users', schema)
        
        assert 'CREATE TABLE [users]' in sql
        assert '[id] NVARCHAR(50)' in sql
        assert '[name] NVARCHAR(MAX)' in sql
        assert '[age] FLOAT' in sql
        assert '[active] BIT' in sql
    
    def test_get_table_schema_sql_with_complex_types(self):
        """Test generazione SQL CREATE TABLE con tipi complessi"""
        mapper = TypeMapper()
        schema = {
            'id': 'id',
            'tags': 'array',
            'metadata': 'object'
        }
        
        sql = mapper.get_table_schema_sql('products', schema)
        
        assert 'CREATE TABLE [products]' in sql
        assert '[id] NVARCHAR(50)' in sql
        assert '[tags] NVARCHAR(MAX)' in sql
        assert '[metadata] NVARCHAR(MAX)' in sql
    
    def test_round_trip_string(self):
        """Test round-trip per string"""
        mapper = TypeMapper()
        original = 'test value'
        converted = mapper.convert_value(original, 'string')
        assert converted == original
    
    def test_round_trip_number(self):
        """Test round-trip per number"""
        mapper = TypeMapper()
        original = 42.5
        converted = mapper.convert_value(original, 'number')
        assert converted == original
    
    def test_round_trip_boolean(self):
        """Test round-trip per boolean"""
        mapper = TypeMapper()
        original = True
        converted = mapper.convert_value(original, 'boolean')
        assert converted == original
    
    def test_round_trip_array(self):
        """Test round-trip per array"""
        mapper = TypeMapper()
        original = [1, 'two', True, None]
        converted = mapper.convert_value(original, 'array')
        restored = json.loads(converted)
        assert restored == original
    
    def test_round_trip_object(self):
        """Test round-trip per object"""
        mapper = TypeMapper()
        original = {'name': 'John', 'age': 30, 'tags': ['a', 'b']}
        converted = mapper.convert_value(original, 'object')
        restored = json.loads(converted)
        assert restored == original
