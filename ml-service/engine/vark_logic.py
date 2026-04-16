def get_recommended_module(preferred_style):
    """
    Returns the module type based on preferred style.
    VARK: Visual (Video), Aural (Audio), Read/Write, Kinesthetic
    """
    mapping = {
        'video': 'video', # Visual
        'audio': 'audio', # Aural
        'read_write': 'read_write',
        'kinesthetic': 'kinesthetic'
    }
    return mapping.get(preferred_style, 'read_write')
